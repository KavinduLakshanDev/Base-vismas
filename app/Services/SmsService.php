<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Models\SmsLog;
use Exception;

class SmsService
{
    protected $config;

    public function __construct()
    {
        $this->config = config('sms');
    }

    /**
     * Send OTP SMS with predefined message format
     */
    public function sendOtp(string $phoneNumber, string $otp, ?string $referenceId = null, ?string $referenceType = null): array
    {
        $companyName = config('app.name', 'UNITEC POS');
        $expireMinutes = config('sms.otp.expire_minutes', 5);
        
        $message = "Your {$companyName} OTP is: {$otp}. Valid for {$expireMinutes} minutes. Do not share with anyone.";
        
        return $this->sendSms($phoneNumber, $message, $referenceId, $referenceType ?: 'otp');
    }

    /**
     * Send Job Creation Notification
     */
    public function sendJobCreationNotification(string $phoneNumber, string $jobNumber): array
    {
        $message = "Job ID ({$jobNumber}) you will be notified upon job completion Thank you";
        
        return $this->sendSms($phoneNumber, $message, $jobNumber, 'job_creation');
    }

    /**
     * Send Job Completion Notification
     */
    public function sendJobCompletionNotification(string $phoneNumber, string $jobNumber, float $totalAmount): array
    {
        $formattedAmount = number_format($totalAmount, 2);
        $message = "JOB ID ({$jobNumber}) Completed total ammount ({$formattedAmount}) Call 0332239606";
        
        return $this->sendSms($phoneNumber, $message, $jobNumber, 'job_completion');
    }

    /**
     * Send SMS
     */
    public function sendSms(
        string $phoneNumber, 
        string $message, 
        ?string $referenceId = null, 
        ?string $referenceType = 'general'
    ): array {
        $user = Auth::user();
        $companyCode = $user ? $user->company_code : session('company_code', 'DEFAULT');
        $sectionCode = $user ? $user->section_code : session('section_code', 'DEFAULT');

        $formattedPhone = $this->formatPhoneNumber($phoneNumber);

        // Create SMS log entry
        $smsLog = SmsLog::updateOrCreate(
            ['phone_number' => $formattedPhone, 'message' => $message, 'status' => 'pending'],
            [
                'company_code' => $companyCode,
                'section_code' => $sectionCode,
                'reference_id' => $referenceId,
                'reference_type' => $referenceType,
                'provider' => $this->config['default_provider'] ?? 'mysql_http'
            ]
        );

        try {
            $result = $this->sendViaApi($formattedPhone, $message);

            if ($result['success']) {
                $smsLog->update([
                    'status' => 'sent',
                    'sent_at' => now(),
                    'provider_message_id' => $result['provider_message_id'] ?? null,
                    'response_data' => $result['response'] ?? null
                ]);

                return [
                    'success' => true,
                    'message' => 'SMS sent successfully',
                    'sms_log_id' => $smsLog->id,
                    'response' => $result['response'] ?? null
                ];
            } else {
                $smsLog->update([
                    'status' => 'failed',
                    'error_message' => $result['error'] ?? 'API error',
                    'response_data' => $result['response'] ?? null
                ]);

                return [
                    'success' => false,
                    'message' => 'Failed to send SMS: ' . ($result['error'] ?? 'Unknown error'),
                    'sms_log_id' => $smsLog->id
                ];
            }
        } catch (Exception $e) {
            Log::error('SMS service exception', [
                'phone_number' => $phoneNumber,
                'exception' => $e->getMessage()
            ]);

            $smsLog->update([
                'status' => 'failed',
                'error_message' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'SMS service error: ' . $e->getMessage(),
                'sms_log_id' => $smsLog->id
            ];
        }
    }

    /**
     * Send via API based on default provider
     */
    private function sendViaApi(string $phone, string $message): array
    {
        $provider = $this->config['default_provider'] ?? 'mysql_http';
        
        if ($provider === 'simulated') {
            return [
                'success' => true,
                'message' => 'Simulated',
                'provider_message_id' => 'sim_' . time()
            ];
        }

        return $this->sendViaBeesLkApi($phone, $message);
    }

    /**
     * Send SMS via bees.lk HTTP API
     */
    private function sendViaBeesLkApi(string $phoneNumber, string $message): array
    {
        try {
            $provider = $this->config['default_provider'] ?? 'mysql_http';
            $providerConfig = $this->config['providers'][$provider] ?? ($this->config['providers']['bees'] ?? []);
            
            if (empty($providerConfig)) {
                return ['success' => false, 'error' => 'Provider configuration not found'];
            }

            $apiUrl = $providerConfig['api_url'] ?? ($providerConfig['api_endpoint'] ?? null);
            $token = $providerConfig['bearer_token'] ?? ($providerConfig['api_token'] ?? null);
            $senderId = $providerConfig['sender_id'] ?? 'UNITECPOS';

            if (!$token || !$apiUrl) {
                return ['success' => false, 'error' => 'SMS API Token or URL not configured'];
            }

            $requestBody = [
                'To' => $phoneNumber,
                'Text' => $message,
                'From' => $senderId,
            ];

            /** @var \Illuminate\Http\Client\Response $response */
            $response = Http::withOptions([
                    'verify' => false,
                    'connect_timeout' => 5,
                ])
                ->retry(2, 100)
                ->timeout(10)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $token,
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ])
                ->post($apiUrl, $requestBody);

            $responseData = $response->json();
            
            Log::info('Bees.lk API Response', [
                'status' => $response->status(),
                'body' => $responseData,
                'url' => $apiUrl
            ]);

            if ($response->successful()) {
                // Check if the response indicates failure even with 200 OK
                if (isset($responseData['status']) && ($responseData['status'] === 'error' || $responseData['status'] === false)) {
                     return [
                        'success' => false,
                        'error' => $responseData['message'] ?? ($responseData['error'] ?? 'API reported error'),
                        'response' => $responseData
                    ];
                }

                return [
                    'success' => true,
                    'provider_message_id' => $responseData['messageId'] ?? ($responseData['id'] ?? ($responseData['data']['id'] ?? null)),
                    'response' => $responseData
                ];
            }

            return [
                'success' => false,
                'error' => $responseData['message'] ?? ($responseData['error'] ?? 'HTTP ' . $response->status()),
                'response' => $responseData
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => 'HTTP request failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Format phone number to international format
     */
    private function formatPhoneNumber(string $phoneNumber): string
    {
        $cleaned = preg_replace('/[^0-9]/', '', $phoneNumber);
        if (str_starts_with($cleaned, '0')) {
            $cleaned = '94' . substr($cleaned, 1);
        }
        if (!str_starts_with($cleaned, '94')) {
            $cleaned = '94' . $cleaned;
        }
        return $cleaned;
    }

    /**
     * Retry failed SMS
     */
    public function retrySms(int $smsLogId): array
    {
        $smsLog = SmsLog::find($smsLogId);
        if (!$smsLog || $smsLog->status === 'sent') {
            return ['success' => false, 'message' => 'Invalid retry'];
        }

        /** @var SmsLog $smsLog */
        $smsLog->increment('retry_count');
        return $this->sendSms($smsLog->phone_number, $smsLog->message, $smsLog->reference_id, $smsLog->reference_type);
    }
}