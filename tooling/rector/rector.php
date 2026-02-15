<?php

declare(strict_types=1);

use Rector\Config\RectorConfig;
use Rector\Set\ValueObject\LevelSetList;
use Rector\Set\ValueObject\SetList;

return RectorConfig::configure()
    ->withPaths([
        __DIR__ . '/../../apps/*/app',
        __DIR__ . '/../../apps/*/config',
        __DIR__ . '/../../apps/*/database',
        __DIR__ . '/../../apps/*/routes',
        __DIR__ . '/../../apps/*/tests',
        __DIR__ . '/../../packages/*/src',
    ])
    ->withSkip([
        '*/vendor/*',
        '*/node_modules/*',
    ])
    ->withSets([
        SetList::PHP_82,
        SetList::CODE_QUALITY,
        SetList::DEAD_CODE,
        SetList::EARLY_RETURN,
        SetList::TYPE_DECLARATION,
    ])
    ->withImportNames();
