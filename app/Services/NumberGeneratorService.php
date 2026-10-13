<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class NumberGeneratorService
{
    public static function generate(string $type, string $companyCode, string $sectionCode): string
    {
        // Simple implementation: TYPE-COMPANY-SECTION-RANDOM
        // Ensure total length <= 20 chars for AccCd compatibility
        
        $prefix = strtoupper(substr($type, 0, 3)); // CUS
        $random = str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
        
        // Truncate company/section codes to keep length manageable
        // Format: PRE-CCC-SSS-RUN
        // 4 + 3 + 1 + 3 + 1 + 4 = 16 chars
        
        $c = substr($companyCode, 0, 3);
        $s = substr($sectionCode, 0, 3);
        
        return "{$prefix}-{$c}-{$s}-{$random}";
    }
}
