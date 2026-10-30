-- Run after every numbered task batch has completed.
-- TEST DATA ONLY. Safe to rerun.
begin;
insert into public.task_resources (id, task_id, kind, label, url)
select r.id, r.task_id, r.kind, r.label, r.url
from (values
  ('c6e44cd3-bb81-5567-9c0f-993aae733da4'::uuid, 'c7e506df-5f74-515f-b388-6966b26a5f5a'::uuid, 'material'::public.task_resource_kind, 'Source link', 'https://pressroom.lexus.com/2027-lexus-es-350h-hybrid-joins-battery-electric-es-350e-es-500e-in-eighth-generation-es-lineup/'),
  ('0f2af536-8e28-59c4-881b-06dc4793e6af'::uuid, '238791c9-94f0-5e20-abf4-35b8ad094b68'::uuid, 'material'::public.task_resource_kind, 'Source link', 'https://pressroom.lexus.com/2027-lexus-es-battery-electric-models-return-with-up-to-307-miles-of-epa-estimated-total-range/'),
  ('d31df7dd-7783-598c-9daa-f8cc66a3c22e'::uuid, 'a707ed28-a540-5dd0-99e8-5f8a6deac6f7'::uuid, 'material'::public.task_resource_kind, 'Source link', 'https://www.gmfleetorderguide.com/brand-list/brand/c72ec4a2-fce4-44c4-a1a4-3aab3cef5886/vehicle/23455/model-home'),
  ('34893cc7-ec7e-5f8c-ba65-62ec4b6a0aa4'::uuid, '32573750-1f8e-568c-a475-35596fca3b17'::uuid, 'material'::public.task_resource_kind, 'Source link', 'https://www.gmfleetorderguide.com/brand-list/brand/77450ee3-dba7-431a-ad58-098f1ebd9f35/vehicle/23413/new-features'),
  ('6b4d2aa0-e649-5f25-bdb3-5f6e9f7e091c'::uuid, 'e3b85af4-b2f4-58c1-bd57-fcfaa98fd24a'::uuid, 'material'::public.task_resource_kind, 'Source link', 'https://www.bronco6g.com/forum/attachments/2027-finalized-og-pdf.822646/'),
  ('6a14c011-db9d-5012-ab16-812d7d0081c8'::uuid, 'c1c56fd4-a886-5a68-b41c-76924b0c0222'::uuid, 'material'::public.task_resource_kind, 'Source link', 'https://www.fordtransitusaforum.com/attachments/2027-ford-transit-dealer-order-guide-pdf.244230/'),
  ('56b87374-cf91-5eb5-bdbd-488f7da8a3a6'::uuid, 'b1ec5dd3-3621-5873-a518-f09b31eac0f8'::uuid, 'material'::public.task_resource_kind, 'Source link', 'https://www.gmfleetorderguide.com/brand-list/brand/2ad71e24-e58f-4c4d-a693-d6036d0a272e/vehicle/23431/model-home'),
  ('df96358c-2d8b-54b7-bf62-21b84fde6b98'::uuid, 'ab3f44af-fe6f-5659-a15b-246cff2416e3'::uuid, 'material'::public.task_resource_kind, 'Source link', 'https://www.caranddriver.com/news/a73235644/2028-honda-ridgeline-teaser/'),
  ('51827ddb-da8e-5922-ae84-a4dc56f6b6d0'::uuid, '373f1efe-2ae2-5673-8db1-65fa2fd5880b'::uuid, 'material'::public.task_resource_kind, 'Source link', 'https://pressroom.lexus.com/2027-lexus-tx-style-meets-family-utility-and-comfort/'),
  ('1b741ac8-8479-5a07-b3ee-a27fa9145b67'::uuid, 'cd5c280f-c97b-500c-a762-2f6eee3b0e55'::uuid, 'material'::public.task_resource_kind, 'Source link', 'https://pressroom.lexus.com/2027-lexus-tx-style-meets-family-utility-and-comfort/'),
  ('5a82e50d-319f-588e-a440-718f154b853a'::uuid, '7356bdd9-37b5-50b3-b978-6e009a86f27e'::uuid, 'material'::public.task_resource_kind, 'Source link', 'https://www.prnewswire.com/news-releases/so-much-more-than-399-a-month-why-the-2027-vf-8-deserves-a-closer-look-302895713.html'),
  ('c7c4a1ff-6ae1-5d1c-b31c-5f15a053a65a'::uuid, '9a733a8e-a4f8-52db-9db2-f7823f1a7d6c'::uuid, 'material'::public.task_resource_kind, 'Source link', 'https://www.caranddriver.com/news/a73333509/volvo-ex50-2027-rumor-report/'),
  ('4bcee68a-c8c9-53e6-9696-706772603507'::uuid, '2c88a15a-cd37-570c-8b01-b28cc9d18c33'::uuid, 'imeet'::public.task_resource_kind, 'iMeet', 'https://caranddriver.imeetcentral.com/mmp-gmchummerevsuv/folder/WzIwLDE5NTk3MDQ1XQ'),
  ('45de97c5-33c4-515c-8653-8d32485bdce8'::uuid, '5a3c6524-3a71-5316-a0a7-d3bc55747bd5'::uuid, 'imeet'::public.task_resource_kind, 'iMeet', 'https://caranddriver.imeetcentral.com/mmp-chevroletsilveradoev/folder/WzIwLDE5NTk4MDIzXQ'),
  ('b659ae5e-bcb0-5077-a6a1-ca49cfb8bfa1'::uuid, '027cf58f-516e-533b-87e2-b9fb79f20746'::uuid, 'imeet'::public.task_resource_kind, 'iMeet', 'https://caranddriver.imeetcentral.com/mmp-mazdacx-30/folder/WzIwLDE5NjAxMTgyXQ'),
  ('eefb50ce-5b6f-56b2-94a9-74bd53cec4ef'::uuid, '0862541b-8896-574e-b2bb-ab6347c9fb43'::uuid, 'imeet'::public.task_resource_kind, 'iMeet', 'https://caranddriver.imeetcentral.com/mmp-mercedes-benzeqssuv/folder/WzIwLDE5NjAwMzk0XQ')
) as r(id, task_id, kind, label, url)
join public.mmp_tasks as t on t.id = r.task_id
on conflict (id) do nothing;

-- Preserve blank publication dates rather than leaving the database trigger's temporary current-time default.
update public.mmp_tasks set published_at = null where id in (
  '3a42cae8-2b8c-5b98-b1d4-c62442669da1'::uuid,
  '1bbcede5-ba69-5d65-a859-d4161fda9c85'::uuid,
  '6782d2f1-1002-5864-af1b-3df48fff73e8'::uuid,
  '5957fdf3-8783-57e6-b269-a7594c3311aa'::uuid,
  'f3425f30-8440-5e58-bf0a-4e282c1d7ef1'::uuid,
  'b0983d23-03a0-5c67-8b0a-73cbc3b7a762'::uuid,
  'b1470e07-887c-5910-b48f-6ce4df0038d2'::uuid,
  'b435c39b-4da3-5203-9e9c-8629a642963c'::uuid,
  '0cdc8bf0-4ed1-5dec-95c2-cc6cad1281e1'::uuid,
  '559ec700-a0d8-5874-8f46-7f715a1b1735'::uuid,
  '91c7aebb-6b4e-51bb-8706-bc5ba6a05a21'::uuid,
  'dbe9ee2d-44ee-5df6-81f9-d0e4e8a7ed0c'::uuid,
  'da7d1967-2460-5bec-bbc6-8bd2c0f5a5fb'::uuid,
  '6be8280b-2532-5098-ac63-15d44a2b1ae0'::uuid
);
commit;
