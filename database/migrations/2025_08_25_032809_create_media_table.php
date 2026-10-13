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
        if (!Schema::hasTable('media')) {
            Schema::create('media', function (Blueprint $table) {
                $table->id();
                $table->string('model_type');
                $table->unsignedBigInteger('model_id');
                $table->uuid('uuid')->nullable()->unique();
                $table->string('collection_name')->default('files');
                $table->string('name');
                $table->string('file_name');
                $table->string('mime_type')->nullable();
                $table->string('disk')->default('public');
                $table->string('conversions_disk')->nullable();
                $table->unsignedBigInteger('size');
                $table->json('manipulations')->default(new \Illuminate\Database\Query\Expression('(JSON_ARRAY())'));
                $table->json('custom_properties')->default(new \Illuminate\Database\Query\Expression('(JSON_ARRAY())'));
                $table->json('generated_conversions')->nullable();
                $table->json('responsive_images')->nullable();
                $table->unsignedInteger('order_column')->nullable();
                $table->foreignId('directory_id')->nullable()->constrained('media_directories')->onDelete('set null');
                $table->foreignId('creator_id')->nullable()->constrained('users')->onDelete('set null');
                $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
                $table->timestamps();

                $table->index(['model_type', 'model_id']);
                $table->index('order_column');
                $table->index('creator_id');
                $table->index('created_by');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('media');
    }
};
