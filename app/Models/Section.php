<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Section extends Model
{
    use HasFactory;    protected $fillable = [
        'uuid',
        'company_code',
        'section_code',
        'name',
        'section_type',
        'is_main_stock',
        'is_active',
        'settings_json',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_main_stock' => 'boolean',
        'settings_json' => 'array',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_code', 'company_code');
    }

    /**
     * Generate the next available unique section code for a given company.
     * Guaranteed not to conflict with any existing section in the database.
     *
     * @param string|null $companyCode
     * @return string
     */
    public static function generateNextCode(?string $companyCode = null): string
    {
        $prefix = 'SEC-';
        if ($companyCode) {
            // Check if $companyCode matches a Company record (by code or name)
            $company = Company::where('company_code', $companyCode)
                ->orWhere('name', $companyCode)
                ->first();

            $source = $company ? $company->company_code : $companyCode;

            // Strip trailing digits (e.g., VIS001 -> VIS, MAL001 -> MAL)
            $letters = preg_replace('/\d+$/', '', $source);
            $cleanPrefix = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $letters ?: $source));

            // If longer than 4 chars (e.g., company name passed without code), take first 3 chars
            if (strlen($cleanPrefix) > 4) {
                $cleanPrefix = substr($cleanPrefix, 0, 3);
            }

            if (!empty($cleanPrefix)) {
                $prefix = "{$cleanPrefix}-SEC-";
            }
        }

        $existingCodes = self::where('section_code', 'LIKE', "{$prefix}%")
            ->pluck('section_code')
            ->toArray();

        $maxNumber = 0;
        foreach ($existingCodes as $code) {
            if (preg_match('/(\d+)$/', $code, $matches)) {
                $num = (int)$matches[1];
                if ($num > $maxNumber) {
                    $maxNumber = $num;
                }
            }
        }

        $nextNumber = $maxNumber + 1;
        $candidateCode = sprintf("%s%03d", $prefix, $nextNumber);

        // Strict collision check: loop until a truly unique code is found
        while (self::where('section_code', $candidateCode)->exists()) {
            $nextNumber++;
            $candidateCode = sprintf("%s%03d", $prefix, $nextNumber);
        }

        return $candidateCode;
    }
}

