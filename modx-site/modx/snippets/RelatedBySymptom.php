<?php
/**
 * RelatedBySymptom — выводит ресурсы (кейси/статьи), у которых TV
 * symptom_tags пересекается с тегом текущей страницы (или с тегом,
 * переданным явно).
 *
 * Использование в шаблоне SymptomPage:
 *   [[RelatedBySymptom? &template=`14` &tpl=`CaseCard` &limit=`2`]]
 *
 * Параметры:
 *   &tag       — слаг симптома; по умолчанию берётся TV symptom_tags
 *                текущего ресурса (для страниц-симптомов) или tag
 *                самого ресурса (для кейсов/статей).
 *   &template  — ID шаблона-источника (CaseDetail или BlogPost).
 *   &exclude   — ID ресурса, который не нужно показывать (обычно [[*id]]).
 *   &tpl       — чанк для рендера одной карточки (CaseCard / BlogCard).
 *   &limit     — сколько карточек вывести.
 */

$tag = trim($tag ?? $modx->resource->getTVValue('symptom_tags'));
$templateId = (int) ($template ?? 0);
$excludeId = (int) ($exclude ?? $modx->resource->get('id'));
$tpl = $tpl ?? 'CaseCard';
$limit = (int) ($limit ?? 3);

if (empty($tag) || empty($templateId)) {
    return '';
}

$c = $modx->newQuery('modResource');
$c->innerJoin('modTemplateVarResource', 'tvr', 'tvr.contentid = modResource.id');
$c->innerJoin('modTemplateVar', 'tv', 'tv.id = tvr.tmplvarid');
$c->where([
    'modResource.template' => $templateId,
    'modResource.published' => 1,
    'modResource.deleted' => 0,
    'modResource.id:!=' => $excludeId,
    'tv.name' => 'symptom_tags',
    'tvr.value:LIKE' => '%' . $tag . '%',
]);
$c->sortby('modResource.publishedon', 'DESC');
$c->limit($limit);

$resources = $modx->getCollection('modResource', $c);
$output = [];

foreach ($resources as $resource) {
    $output[] = $modx->getChunk($tpl, [
        'id' => $resource->get('id'),
        'pagetitle' => $resource->get('pagetitle'),
        'url' => $modx->makeUrl($resource->get('id')),
        'excerpt' => $resource->get('introtext'),
    ]);
}

return implode("\n", $output);
