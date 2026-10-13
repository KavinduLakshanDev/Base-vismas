<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('settings')) {
            Schema::create('settings', function (Blueprint $table) {
                $table->id();
                $table->string('key');
                $table->text('value')->nullable();
                $table->boolean('is_public')->default(true);
                $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('cascade');
                $table->timestamps();

                $table->index('key');
            });

            // Insert default storage settings
            DB::table('settings')->insert([
                [
                    'key' => 'storageType',
                    'value' => 'local',
                    'is_public' => true,
                    'created_by' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'key' => 'allowedFileTypes',
                    'value' => 'jpg,jpeg,png,webp,gif,pdf,doc,docx,csv,txt,zip,mp4,mp3,xlsx',
                    'is_public' => true,
                    'created_by' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'key' => 'maxUploadSize',
                    'value' => '10240',
                    'is_public' => true,
                    'created_by' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
