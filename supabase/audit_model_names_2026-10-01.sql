-- BINHAI AUTO: read-only аудит названий брендов и моделей.
-- Этот файл ничего не изменяет в базе. Выполняйте запросы по одному.

-- 1) Все строки с явными признаками сырого/служебного названия.
select
  id,
  source_id,
  brand,
  model,
  year,
  case
    when lower(trim(coalesce(brand, ''))) in ('baic', 'beijing', 'бэйцзин', 'пекинская', 'пекин')
         and lower(coalesce(model, '')) like '%m7%' then 'BAW M7 alias'
    when lower(trim(coalesce(brand, ''))) in ('gac', 'guangzhou', 'гуанчжоу', 'гавчи', '广汽')
         and (lower(coalesce(model, '')) like '%trumpchi%'
              or lower(coalesce(model, '')) like '%chuanqi%'
              or lower(coalesce(model, '')) like '%чуаньци%'
              or coalesce(model, '') like '%传祺%') then 'GAC Trumpchi alias'
    when lower(coalesce(model, '')) ~ '(^|[,[:space:]])(model|модель)([,[:space:]]|$)' then 'service word: model'
    when coalesce(brand, '') ~ '[А-Яа-яЁё一-龥]' or coalesce(model, '') ~ '[А-Яа-яЁё一-龥]' then 'non-latin source text'
    when lower(coalesce(brand, '')) ~ 'haval+|havel|havall|jietu|jetour|mercedes|гавчи|гуанчжоу|бьюик|фольксваген|хонда|мазда|нисан|шкода|тойота|киа|пежо|мерседес' then 'brand alias'
    else null
  end as issue
from public.cars
where
  lower(trim(coalesce(brand, ''))) in ('baic', 'beijing', 'бэйцзин', 'пекинская', 'пекин', 'gac', 'guangzhou', 'гуанчжоу', 'гавчи', '广汽')
  or lower(coalesce(model, '')) ~ '(^|[,[:space:]])(model|модель)([,[:space:]]|$)'
  or coalesce(brand, '') ~ '[А-Яа-яЁё一-龥]'
  or coalesce(model, '') ~ '[А-Яа-яЁё一-龥]'
  or lower(coalesce(brand, '')) ~ 'haval+|havel|havall|jietu|jetour|mercedes|гавчи|гуанчжоу|бьюик|фольксваген|хонда|мазда|нисан|шкода|тойота|киа|пежо|мерседес'
order by issue, brand, model, year, source_id;

-- 2) Группы, которые после базовой нормализации будут выглядеть одинаково.
with normalized as (
  select
    id,
    source_id,
    brand,
    model,
    year,
    case
      when lower(trim(coalesce(brand, ''))) like '%mercedes%' or trim(coalesce(brand, '')) like '%奔驰%' or lower(coalesce(brand, '')) like '%мерседес%' then 'Mercedes-Benz'
      when lower(trim(coalesce(brand, ''))) in ('haval', 'havall') or lower(coalesce(brand, '')) like '%хавал%' or trim(coalesce(brand, '')) like '%哈弗%' then 'Haval'
      when lower(trim(coalesce(brand, ''))) in ('jetour', 'jietu') or lower(coalesce(brand, '')) like '%джетур%' or trim(coalesce(brand, '')) like '%捷途%' then 'Jetour'
      when lower(trim(coalesce(brand, ''))) in ('gac', 'guangzhou', 'гуанчжоу', 'гавчи') or trim(coalesce(brand, '')) like '%广汽%' then 'GAC'
      when lower(trim(coalesce(brand, ''))) in ('beijing', 'beijing-hyundai', 'бэйцзин', 'пекинская', 'пекин')
           and lower(coalesce(model, '')) ~ 'hyundai|ix35' then 'Hyundai'
      when lower(trim(coalesce(brand, ''))) = 'baic'
           and lower(coalesce(model, '')) ~ 'm7|руйшэн|ruisheng|вейцзя|wangpai' then 'BAW'
      when lower(trim(coalesce(brand, ''))) in ('бьюик', 'buick') then 'Buick'
      when lower(trim(coalesce(brand, ''))) in ('фольксваген', 'volkswagen') then 'Volkswagen'
      when lower(trim(coalesce(brand, ''))) in ('хонда', 'honda') then 'Honda'
      when lower(trim(coalesce(brand, ''))) in ('мазда', 'mazda') then 'Mazda'
      when lower(trim(coalesce(brand, ''))) in ('нисан', 'nissan') then 'Nissan'
      when lower(trim(coalesce(brand, ''))) in ('шкода', 'skoda') then 'Skoda'
      when lower(trim(coalesce(brand, ''))) in ('тойота', 'toyota') then 'Toyota'
      when lower(trim(coalesce(brand, ''))) in ('киа', 'kia') then 'Kia'
      when lower(trim(coalesce(brand, ''))) in ('пежо', 'peugeot') then 'Peugeot'
      else trim(brand)
    end as canonical_brand,
    trim(regexp_replace(
      regexp_replace(coalesce(model, ''), '(^|[[:space:],])(модель|model)([[:space:],]|$)', '\1\3', 1, 0, 'i'),
      '^(Trumpchi|Chuanqi|чуаньци|传祺)[[:space:]]*', '', 1, 1, 'i'
    )) as canonical_model
  from public.cars
)
select canonical_brand, canonical_model, count(*) as cars_count,
       array_agg(id order by id) as row_ids
from normalized
where canonical_brand is not null and canonical_model <> ''
group by canonical_brand, canonical_model
having count(*) > 1
order by cars_count desc, canonical_brand, canonical_model;

-- 3) Все уникальные пары бренд/модель для ручной проверки.
select brand, model, count(*) as cars_count
from public.cars
group by brand, model
order by brand, model;
