<?php

class MimeTypeDetector
{
    private static array $map = [
        'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg',
        'png' => 'image/png', 'webp' => 'image/webp',
        'gif' => 'image/gif',
        'mp4' => 'video/mp4', 'webm' => 'video/webm',
        'mov' => 'video/quicktime', 'mpeg' => 'video/mpeg',
        'mpg' => 'video/mpeg', 'avi' => 'video/x-msvideo',
    ];

    public static function detect(string $filePath, string $originalName = ''): string
    {
        if (function_exists('finfo_open')) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mime = finfo_file($finfo, $filePath);
            finfo_close($finfo);
            if ($mime && $mime !== 'application/octet-stream') {
                return $mime;
            }
        }

        if ($originalName) {
            $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
            if (isset(self::$map[$ext])) {
                return self::$map[$ext];
            }
        }

        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        return self::$map[$ext] ?? 'application/octet-stream';
    }
}
