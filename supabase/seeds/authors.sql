-- Initial active Author roster provided by the project owner.
-- Safe to run repeatedly: existing labels are left unchanged.
insert into public.authors (first_name, last_name, label, initials, team, active)
values
  ('Alayna', 'Wilkening', 'Alayna Wilkening', 'AW', 'freelance', true),
  ('Austin', 'Irwin', 'Austin Irwin', 'AI', 'cd', true),
  ('Austin', 'Parsons', 'Austin Parsons', 'AP', 'bg', true),
  ('Becca', 'Hackett', 'Becca Hackett', 'BH', 'cd', true),
  ('Beth', 'Nichols', 'Beth Nichols', 'BN', 'freelance', true),
  ('Caleb', 'Miller', 'Caleb Miller', 'CM', 'cd', true),
  ('Rich', 'Ceppos', 'Rich Ceppos', 'RC', 'bg', true),
  ('Clifford', 'Atiyeh', 'Clifford Atiyeh', 'CA', 'freelance', true),
  ('Drew', 'Dorian', 'Drew Dorian', 'DD', 'bg', true),
  ('Mike', 'Duff', 'Mike Duff', 'MD', 'freelance', true),
  ('Elana', 'Scherr', 'Elana Scherr', 'ES', 'cd', true),
  ('Eric', 'Stafford', 'Eric Stafford', 'ES', 'cd', true),
  ('Ezra', 'Dyer', 'Ezra Dyer', 'ED', 'cd', true),
  ('David', 'Gluckman', 'David Gluckman', 'DG', 'freelance', true),
  ('Greg', 'Fink', 'Greg Fink', 'GF', 'cd', true),
  ('Jack', 'Fitzgerald', 'Jack Fitzgerald', 'JF', 'cd', true),
  ('Jacob', 'Kurowicki', 'Jacob Kurowicki', 'JK', 'cd', true),
  ('Joey', 'Capparella', 'Joey Capparella', 'JC', 'bg', true),
  ('Andrew', 'Krok', 'Andrew Krok', 'AK', 'cd', true),
  ('Joe', 'Lorio', 'Joe Lorio', 'JL', 'cd', true),
  ('Larry', 'Printz', 'Larry Printz', 'LP', 'freelance', true),
  ('Jonathon', 'Ramsey', 'Jonathon Ramsey', 'JR', 'freelance', true),
  ('Kristin', 'Shaw', 'Kristin Shaw', 'KS', 'freelance', true),
  ('Andy', 'Wendler', 'Andy Wendler', 'AW', 'bg', true)
on conflict do nothing;
