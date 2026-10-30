-- TEST DATA ONLY. Run these batches in numeric order after the Catalog and Author seeds.
-- Each file is small enough for the Supabase SQL Editor and commits independently.
-- If a batch errors, stop there; earlier batches are safe to leave in place.
begin;
with import_source(id, source_row, source_make, model, model_year, author_label, status, task_kind, deadline, notes, embargo_at, embargo_notes, published_at, imported_at) as (
values
    ('55ae3f11-9e3a-5550-9221-9a2b991eac69'::uuid, 5555, 'Chevrolet', 'Bolt EUV', 2022, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-23T00:00:00-05:00', timestamptz '2021-02-23T00:00:00-05:00'),
    ('b432cb63-3f58-52e6-a016-209b350f1e6e'::uuid, 5556, 'Kia', 'Carnival', 2022, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-23T00:00:00-05:00', timestamptz '2021-02-23T00:00:00-05:00'),
    ('d551cba6-8994-58d8-85b3-989131dff98b'::uuid, 5557, 'Hyundai', 'Kona Electric', 2022, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-22T00:00:00-05:00', timestamptz '2021-02-22T00:00:00-05:00'),
    ('21c80bf0-ecde-5976-8c2a-180d9bb085ae'::uuid, 5558, 'Mitsubishi', 'Outlander', 2021, 'Eric Stafford', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-22T00:00:00-05:00', timestamptz '2021-02-22T00:00:00-05:00'),
    ('c8c433c2-c0b0-584c-b0d6-ecd37f5c8c29'::uuid, 5559, 'Kia', 'K5', 2021, 'Eric Stafford', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-22T00:00:00-05:00', timestamptz '2021-02-22T00:00:00-05:00'),
    ('6907abde-c865-533c-b19a-444818e84253'::uuid, 5560, 'Porsche', 'Taycan Cross Turismo', 2021, 'Eric Stafford', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-22T00:00:00-05:00', timestamptz '2021-02-22T00:00:00-05:00'),
    ('c42f58b0-02c3-5b00-9b45-6c859ebc55e0'::uuid, 5561, 'Land Rover', 'Defender', 2022, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-18T00:00:00-05:00', timestamptz '2021-02-18T00:00:00-05:00'),
    ('be98f665-b9ad-530c-8754-ec903ead7380'::uuid, 5562, 'Acura', 'MDX', 2022, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-18T00:00:00-05:00', timestamptz '2021-02-18T00:00:00-05:00'),
    ('bc12bef6-dc45-50af-97b8-49a503981446'::uuid, 5563, 'Buick', 'Envision', 2021, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-18T00:00:00-05:00', timestamptz '2021-02-18T00:00:00-05:00'),
    ('4e457859-6f99-54b4-8e83-0154eea60718'::uuid, 5564, 'Hyundai', 'Ioniq 5', 2022, 'Eric Stafford', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-18T00:00:00-05:00', timestamptz '2021-02-18T00:00:00-05:00'),
    ('9511754b-430e-5e32-b879-ac97be78d0ca'::uuid, 5565, 'Kia', 'Carnival', 2022, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-18T00:00:00-05:00', timestamptz '2021-02-18T00:00:00-05:00'),
    ('a9f46120-846f-51e8-a524-fdb606d473b4'::uuid, 5566, 'Nissan', 'Rogue Sport', 2022, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-16T00:00:00-05:00', timestamptz '2021-02-16T00:00:00-05:00'),
    ('1e41f11c-b078-504a-8c6e-1cb77e499136'::uuid, 5567, 'Mercedes-Benz', 'GLC-class', 2022, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-16T00:00:00-05:00', timestamptz '2021-02-16T00:00:00-05:00'),
    ('7133b5d3-bb84-5816-916c-ae149aab2281'::uuid, 5568, 'Mercedes-Benz', 'C-class', 2022, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-16T00:00:00-05:00', timestamptz '2021-02-16T00:00:00-05:00'),
    ('d1666f8f-09ff-56fd-b5b8-4d7aac0c839d'::uuid, 5569, 'Honda', 'HR-V', 2022, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-16T00:00:00-05:00', timestamptz '2021-02-16T00:00:00-05:00'),
    ('102bde5c-e21f-5d26-88a6-290e0795facc'::uuid, 5570, 'Hyundai', 'Santa Fe', 2021, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-16T00:00:00-05:00', timestamptz '2021-02-16T00:00:00-05:00'),
    ('87503a99-18cd-5435-a5c3-2e332fc77086'::uuid, 5571, 'Maserati', 'Grecale', 2022, 'Eric Stafford', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-16T00:00:00-05:00', timestamptz '2021-02-16T00:00:00-05:00'),
    ('3255bc2a-77c2-54cb-831e-8880dab80d50'::uuid, 5572, 'Tesla', 'Model 3', 2021, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-14T00:00:00-05:00', timestamptz '2021-02-14T00:00:00-05:00'),
    ('d89565f7-49fd-52b6-ad21-424082b3c9ca'::uuid, 5573, 'Tesla', 'Model Y', 2021, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-14T00:00:00-05:00', timestamptz '2021-02-14T00:00:00-05:00'),
    ('cbd100a2-7947-5c98-a497-6913960825c2'::uuid, 5574, 'Mitsubishi', 'Outlander', 2022, 'Eric Stafford', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-11T00:00:00-05:00', timestamptz '2021-02-11T00:00:00-05:00'),
    ('d647f8eb-58d5-563f-b9af-d1614e3e5178'::uuid, 5575, 'Maserati', 'Ghibli', 2021, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-11T00:00:00-05:00', timestamptz '2021-02-11T00:00:00-05:00'),
    ('6d0f698f-fcd4-5e86-aa0d-43b990c2b07a'::uuid, 5576, 'Porsche', '911 GT3 / GT3 RS', 2022, 'Eric Stafford', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-10T00:00:00-05:00', timestamptz '2021-02-10T00:00:00-05:00'),
    ('aee69cd9-91fa-5ac0-abda-8a918be515bf'::uuid, 5577, 'Hyundai', 'Kona', 2022, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-10T00:00:00-05:00', timestamptz '2021-02-10T00:00:00-05:00'),
    ('ab213eb3-28e0-58f3-8d8e-16a4272a4f24'::uuid, 5578, 'Mercedes-Benz', 'EQC', 2021, null, 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-10T00:00:00-05:00', timestamptz '2021-02-10T00:00:00-05:00'),
    ('7544b6a8-b9f0-5041-9d21-65a42ad910b5'::uuid, 5579, 'Infiniti', 'QX55', 2022, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-10T00:00:00-05:00', timestamptz '2021-02-10T00:00:00-05:00'),
    ('2467b52f-8b23-549e-bd29-d3e300de4ece'::uuid, 5580, 'Chevrolet', 'Bolt EUV', 2022, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-09T00:00:00-05:00', timestamptz '2021-02-09T00:00:00-05:00'),
    ('0cae5d44-e7b7-52bc-a0a6-97d9c3271b35'::uuid, 5581, 'Chevrolet', 'Bolt EV', 2022, 'Eric Stafford', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-09T00:00:00-05:00', timestamptz '2021-02-09T00:00:00-05:00'),
    ('ad9ad11e-83db-5592-af8b-b528732e5dc2'::uuid, 5582, 'Infiniti', 'QX60', 2022, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-09T00:00:00-05:00', timestamptz '2021-02-09T00:00:00-05:00'),
    ('3f4e43f2-6661-5ea8-8380-a8abdbd9d0da'::uuid, 5583, 'Mercedes-Benz', 'C-class', 2022, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-08T00:00:00-05:00', timestamptz '2021-02-08T00:00:00-05:00'),
    ('3983161d-69b6-585d-ae2a-30bd7f28a9d5'::uuid, 5584, 'BMW', '8-series', 2021, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-05T00:00:00-05:00', timestamptz '2021-02-05T00:00:00-05:00'),
    ('fd11126b-f85a-57ec-b73e-f3b6dfc4e757'::uuid, 5585, 'Ford', 'Transit Connect', 2021, 'Eric Stafford', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-04T00:00:00-05:00', timestamptz '2021-02-04T00:00:00-05:00'),
    ('2b04896e-f41e-5129-bb38-0edae6be4a08'::uuid, 5586, 'Kia', 'Carnival', 2022, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-04T00:00:00-05:00', timestamptz '2021-02-04T00:00:00-05:00'),
    ('ff7753a2-c27c-5288-bf17-54ea08c4423d'::uuid, 5587, 'BMW', 'i3', 2021, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-03T00:00:00-05:00', timestamptz '2021-02-03T00:00:00-05:00'),
    ('6496e859-687e-560a-a198-92307e854fd2'::uuid, 5588, 'Mitsubishi', 'Eclipse Cross', 2022, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-02T00:00:00-05:00', timestamptz '2021-02-02T00:00:00-05:00'),
    ('5d272cec-2830-5031-9211-4704f65baa0c'::uuid, 5589, 'Audi', 'e-tron GT', 2022, 'Eric Stafford', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-02T00:00:00-05:00', timestamptz '2021-02-02T00:00:00-05:00'),
    ('d3c4c1b9-1cd7-5446-8b9c-d4a4fa2af400'::uuid, 5590, 'Cadillac', 'Escalade', 2021, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-01T00:00:00-05:00', timestamptz '2021-02-01T00:00:00-05:00'),
    ('7edc89f6-cf29-56dd-8703-d0ae1649a903'::uuid, 5591, 'Ford', 'Mustang Shelby GT500', 2021, 'Eric Stafford', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-02-01T00:00:00-05:00', timestamptz '2021-02-01T00:00:00-05:00'),
    ('e96939ad-8677-5fbe-b90c-9c3a207067b9'::uuid, 5592, 'Aston Martin', 'Valkyrie', 2022, 'Eric Stafford', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-29T00:00:00-05:00', timestamptz '2021-01-29T00:00:00-05:00'),
    ('73dc7ac1-78b0-54a0-84c0-0f6f7d8aad14'::uuid, 5593, 'Nissan', 'Pathfinder', 2022, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-29T00:00:00-05:00', timestamptz '2021-01-29T00:00:00-05:00'),
    ('ced9aadb-10de-5b87-8300-4f8889343c63'::uuid, 5594, 'Nissan', 'Frontier', 2022, 'Eric Stafford', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-28T00:00:00-05:00', timestamptz '2021-01-28T00:00:00-05:00'),
    ('7fa51ab1-6487-5216-a440-c8f2e9e34002'::uuid, 5595, 'Ford', 'F-150 Raptor', 2021, 'Eric Stafford', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-28T00:00:00-05:00', timestamptz '2021-01-28T00:00:00-05:00'),
    ('4c94fc0a-e6c6-546b-a55c-cd6b6318367c'::uuid, 5596, 'Hyundai', 'Elantra', 2021, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-28T00:00:00-05:00', timestamptz '2021-01-28T00:00:00-05:00'),
    ('319450a3-4845-5230-993a-77d4510345ae'::uuid, 5597, 'Aston Martin', 'DBX', 2021, 'Eric Stafford', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-27T00:00:00-05:00', timestamptz '2021-01-27T00:00:00-05:00'),
    ('af44c3ad-b08c-5a14-b771-9c6e0fa92ca0'::uuid, 5598, 'Cadillac', 'CT5-V Blackwing', 2022, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-27T00:00:00-05:00', timestamptz '2021-01-27T00:00:00-05:00'),
    ('872bba8a-4142-53f3-88b1-0702d78efec1'::uuid, 5599, 'Cadillac', 'CT4-V Blackwing', 2022, 'Eric Stafford', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-27T00:00:00-05:00', timestamptz '2021-01-27T00:00:00-05:00'),
    ('fbd2ae54-b107-5dd1-bacc-a3f96d6b725f'::uuid, 5600, 'BMW', '4-series', 2021, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-27T00:00:00-05:00', timestamptz '2021-01-27T00:00:00-05:00'),
    ('a4edcd97-4565-5f11-b147-eac7a8c5ef32'::uuid, 5601, 'Cadillac', 'Escalade', 2021, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-27T00:00:00-05:00', timestamptz '2021-01-27T00:00:00-05:00'),
    ('34cddc2d-84bd-5df5-b0c4-59713d6762ef'::uuid, 5602, 'Porsche', '911 Turbo / Turbo S', 2021, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-27T00:00:00-05:00', timestamptz '2021-01-27T00:00:00-05:00'),
    ('2e097d02-4fbc-54fe-a3a8-4a5bffdd3839'::uuid, 5603, 'Audi', 'e-tron GT', 2021, 'Eric Stafford', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-27T00:00:00-05:00', timestamptz '2021-01-27T00:00:00-05:00'),
    ('52048bd8-678c-59c7-b021-3eacc01bc0bf'::uuid, 5604, 'Acura', 'MDX', 2022, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-27T00:00:00-05:00', timestamptz '2021-01-27T00:00:00-05:00'),
    ('c2988f00-5e18-5c69-8c4f-50fbde42991d'::uuid, 5605, 'Tesla', 'Model X', 2021, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-27T00:00:00-05:00', timestamptz '2021-01-27T00:00:00-05:00'),
    ('8353b0d8-cbb8-5033-b6d6-d59af7bab814'::uuid, 5606, 'Tesla', 'Model S', 2021, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-26T00:00:00-05:00', timestamptz '2021-01-26T00:00:00-05:00'),
    ('d4e542dd-79ec-5426-be04-334f5bab5d5f'::uuid, 5607, 'Lincoln', 'Navigator', 2021, 'Eric Stafford', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-26T00:00:00-05:00', timestamptz '2021-01-26T00:00:00-05:00'),
    ('821c9646-fc50-55fc-a88e-eec92a396c38'::uuid, 5608, 'Ford', 'Expedition', 2021, 'Eric Stafford', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-26T00:00:00-05:00', timestamptz '2021-01-26T00:00:00-05:00'),
    ('ad9b2764-dae5-53de-820d-ed4598970f56'::uuid, 5609, 'Mercedes-Maybach', 'GLS-class', 2021, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-26T00:00:00-05:00', timestamptz '2021-01-26T00:00:00-05:00'),
    ('78100f78-420f-518a-b608-73c358fc7702'::uuid, 5610, 'Ford', 'F-150', 2021, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-26T00:00:00-05:00', timestamptz '2021-01-26T00:00:00-05:00'),
    ('d7d04852-f00f-5fc6-8e8c-d5b7d9727add'::uuid, 5611, 'Volvo', 'XC40 Recharge', 2021, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-21T00:00:00-05:00', timestamptz '2021-01-21T00:00:00-05:00'),
    ('2ef9dde9-1e52-537e-9beb-e0b8b62ade55'::uuid, 5612, 'Mercedes-Benz', 'EQB', 2022, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-21T00:00:00-05:00', timestamptz '2021-01-21T00:00:00-05:00'),
    ('41b08870-f2ea-5c02-bd44-6259a74f00d4'::uuid, 5613, 'Mini', 'Cooper JCW', 2022, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-20T00:00:00-05:00', timestamptz '2021-01-20T00:00:00-05:00'),
    ('6ce5a839-3de2-5a8d-8088-3fbd1a6f1322'::uuid, 5614, 'BMW', 'M5', 2022, 'Eric Stafford', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-19T00:00:00-05:00', timestamptz '2021-01-19T00:00:00-05:00'),
    ('f29a25fa-fc04-51ae-a619-8f6f4f139677'::uuid, 5615, 'Mini', 'Cooper Hardtop/Convertible', 2022, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-15T00:00:00-05:00', timestamptz '2021-01-15T00:00:00-05:00'),
    ('36a1c88a-efdc-5aa2-812f-3ce39aa1a59f'::uuid, 5616, 'Mini', 'Cooper Electric', 2022, 'Eric Stafford', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-15T00:00:00-05:00', timestamptz '2021-01-15T00:00:00-05:00'),
    ('59660dd0-70a6-5c56-bc07-dea362363d3e'::uuid, 5617, 'McLaren', 'Elva', 2021, 'Eric Stafford', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-14T00:00:00-05:00', timestamptz '2021-01-14T00:00:00-05:00'),
    ('4417ee9e-bb60-5866-ac16-89129aee957c'::uuid, 5618, 'Nissan', '400Z', 2022, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-14T00:00:00-05:00', timestamptz '2021-01-14T00:00:00-05:00'),
    ('6cc396eb-b975-5397-b586-ed55d6b46e54'::uuid, 5619, 'Buick', 'Enclave', 2022, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-14T00:00:00-05:00', timestamptz '2021-01-14T00:00:00-05:00'),
    ('4bf83edd-6436-5f6e-8908-11be15935a3c'::uuid, 5620, 'Buick', 'Envision', 2021, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-14T00:00:00-05:00', timestamptz '2021-01-14T00:00:00-05:00'),
    ('b037c56e-da31-5ef1-b2ad-a2f99457ab9e'::uuid, 5621, 'Mercedes-Benz', 'EQA', 2022, 'Joey Capparella', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-14T00:00:00-05:00', timestamptz '2021-01-14T00:00:00-05:00'),
    ('9e9e24d6-3ecb-5a6b-aead-9913b26778ed'::uuid, 5622, 'Chevrolet', 'Bolt EV', 2021, 'Eric Stafford', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-14T00:00:00-05:00', timestamptz '2021-01-14T00:00:00-05:00'),
    ('66c59671-855e-56b8-abab-d9ddbbddce9f'::uuid, 5623, 'Cadillac', 'Celestiq', 2025, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-13T00:00:00-05:00', timestamptz '2021-01-13T00:00:00-05:00'),
    ('494f32a9-06c5-5459-876b-7054c3bce5c3'::uuid, 5624, 'Honda', 'Odyssey', 2022, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-12T00:00:00-05:00', timestamptz '2021-01-12T00:00:00-05:00'),
    ('02aaa6e8-284b-5d2d-88cf-bad2f95a6909'::uuid, 5625, 'Honda', 'HR-V', 2022, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-06T00:00:00-05:00', timestamptz '2021-01-06T00:00:00-05:00'),
    ('96e1fc44-749a-5cba-b9c3-2053435e899f'::uuid, 5626, 'Porsche', 'Taycan', 2021, 'Eric Stafford', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-06T00:00:00-05:00', timestamptz '2021-01-06T00:00:00-05:00'),
    ('f1f99635-8895-5d9f-b9d8-905ae52d58ec'::uuid, 5627, 'Lexus', 'NX', 2022, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', timestamptz '2021-01-05T00:00:00-05:00', timestamptz '2021-01-05T00:00:00-05:00'),
    ('b1470e07-887c-5910-b48f-6ce4df0038d2'::uuid, 5628, 'Mitsubishi', 'Mirage', 2021, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', null, null),
    ('b435c39b-4da3-5203-9e9c-8629a642963c'::uuid, 5629, 'Mitsubishi', 'Mirage G4', 2021, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', null, null),
    ('0cdc8bf0-4ed1-5dec-95c2-cc6cad1281e1'::uuid, 5630, 'Nissan', 'NV200', 2021, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', null, null),
    ('559ec700-a0d8-5874-8f46-7f715a1b1735'::uuid, 5631, 'Fiat', '500 X', 2021, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', null, null),
    ('91c7aebb-6b4e-51bb-8706-bc5ba6a05a21'::uuid, 5632, 'Ford', 'Maverick', 2022, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', null, null),
    ('dbe9ee2d-44ee-5df6-81f9-d0e4e8a7ed0c'::uuid, 5633, 'Jeep', 'Grand Cherokee', 2022, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', null, null),
    ('da7d1967-2460-5bec-bbc6-8bd2c0f5a5fb'::uuid, 5634, 'Jeep', 'Grand Cherokee', 2021, 'Drew Dorian', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', null, null),
    ('6be8280b-2532-5098-ac63-15d44a2b1ae0'::uuid, 5635, 'Mercedes-AMG', 'A35', 2021, 'Beth Nichols', 'published'::public.task_status, 'new_mmp'::public.task_kind, null, '', null, '', null, null)
), matched as (
  select s.id, s.source_row, s.source_make, s.model, s.model_year, s.author_label,
    s.status, s.task_kind, s.deadline::date as deadline, s.notes,
    s.embargo_at::timestamptz as embargo_at, s.embargo_notes,
    s.published_at::timestamptz as published_at, s.imported_at::timestamptz as imported_at,
    v.id as vehicle_id, a.id as author_id
  from import_source s
  left join public.makes mk on lower(btrim(mk.name)) = lower(btrim(s.source_make))
  left join public.models mo on mo.make_id = mk.id and lower(btrim(mo.name)) = lower(btrim(s.model))
  left join public.model_year_vehicles v on v.model_id = mo.id and v.model_year = s.model_year
  left join public.authors a on lower(btrim(a.label)) = lower(btrim(s.author_label))
), to_insert as (
  select m.*
  from matched m
  where m.vehicle_id is not null
    and (m.status in ('published', 'updated') or not exists (
      select 1
      from public.mmp_tasks existing
      where existing.id <> m.id
        and existing.model_year_vehicle_id = m.vehicle_id
        and existing.status = m.status
        and existing.task_kind = m.task_kind
        and existing.author_id is not distinct from m.author_id
        and existing.deadline is not distinct from m.deadline
        and existing.notes = coalesce(m.notes, '')
        and existing.embargo_at is not distinct from m.embargo_at
        and existing.embargo_notes = coalesce(m.embargo_notes, '')
    ))
), inserted as (
  insert into public.mmp_tasks (id, model_year_vehicle_id, author_id, status, task_kind, deadline, notes, embargo_at, embargo_notes, published_at, created_at)
  select id, vehicle_id, author_id, status, task_kind, deadline, coalesce(notes, ''), embargo_at, coalesce(embargo_notes, ''), published_at, coalesce(imported_at, now())
  from to_insert
  on conflict (id) do nothing
  returning id
)
select
  (select count(*) from import_source) as importable_source_rows,
  (select count(*) from matched where vehicle_id is not null) as catalog_matches,
  (select count(*) from matched where vehicle_id is null) as unmatched_catalog_rows,
  (select array_agg(format('%s %s (%s)', source_make, model, model_year) order by source_make, model, model_year)
     from (select distinct source_make, model, model_year from matched where vehicle_id is null order by source_make, model, model_year limit 25) missing) as unmatched_examples,
  (select count(*) from matched where author_label is null) as rows_without_linked_author,
  (select count(*) from inserted) as inserted_task_rows,
  (select count(*) from matched where vehicle_id is not null) - (select count(*) from inserted) as existing_or_repeat_task_rows;
commit;
