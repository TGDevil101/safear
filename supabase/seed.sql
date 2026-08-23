-- SafeAR — seed data. Run after schema.sql.
-- Safe to re-run: every insert is idempotent.

-- ----------------------------------------------------------------- modules

insert into public.modules (id, name, description, total_questions, pass_score) values
  ('fire', 'Fire & Explosion Response',  'Identify a fire, choose the right extinguisher, evacuate safely.', 5, 80),
  ('gas',  'Gas Leak & Confined Space',  'Spot a leak, wear the right PPE, use the buddy system, escape upwind.', 5, 80)
on conflict (id) do update
  set name = excluded.name, description = excluded.description;

-- --------------------------------------------------------------- questions
-- Mirrors src/lib/questions.ts. The app bundles the same content so the quiz
-- still runs with no network; these rows exist for the dashboard and for the
-- finals build, where questions are edited without a redeploy.

insert into public.questions (id, module_id, question_text, options, correct_index, explanation) values
  ('fire-q1', 'fire',
   '{"en":"An electrical control panel catches fire. Which extinguisher do you use?","hi":"बिजली के कंट्रोल पैनल में आग लग जाती है। आप कौन सा अग्निशामक उपयोग करेंगे?"}',
   '{"en":["Water","Foam","CO₂","Sand bucket"],"hi":["पानी","फोम","CO₂","रेत की बाल्टी"]}',
   2,
   '{"en":"Water and foam conduct electricity. CO₂ is non-conductive and leaves no residue.","hi":"पानी और फोम बिजली का संचालन करते हैं। CO₂ संचालक नहीं है।"}'),

  ('fire-q2', 'fire',
   '{"en":"You reach an exit and find it blocked by debris. What do you do?","hi":"आप निकास पर पहुँचते हैं और वह मलबे से बंद मिलता है। आप क्या करेंगे?"}',
   '{"en":["Clear the debris yourself","Go to the alternate marked exit","Wait there for help","Break a window"],"hi":["खुद मलबा हटाएँ","दूसरे चिह्नित निकास पर जाएँ","वहीं मदद का इंतज़ार करें","खिड़की तोड़ें"]}',
   1,
   '{"en":"Never spend time clearing a blocked exit during a fire.","hi":"आग के समय बंद निकास साफ़ करने में समय न लगाएँ।"}'),

  ('fire-q3', 'fire',
   '{"en":"What is the correct order after evacuating?","hi":"निकासी के बाद सही क्रम क्या है?"}',
   '{"en":["Assembly point → headcount → report missing","Headcount → report missing → assembly point","Report missing → assembly point → headcount","Any order is fine"],"hi":["एकत्रण स्थल → गिनती → लापता की सूचना","गिनती → लापता की सूचना → एकत्रण स्थल","लापता की सूचना → एकत्रण स्थल → गिनती","कोई भी क्रम ठीक है"]}',
   0,
   '{"en":"You cannot count reliably until everyone has reached the assembly point.","hi":"जब तक सब एकत्रण स्थल न पहुँचें, सही गिनती नहीं हो सकती।"}'),

  ('fire-q4', 'fire',
   '{"en":"Who may declare the all-clear after a fire emergency?","hi":"आग की आपात स्थिति के बाद ऑल-क्लियर कौन घोषित कर सकता है?"}',
   '{"en":["Any worker who sees no flames","The first person back inside","The shift with the most experience","The designated supervisor or fire officer"],"hi":["कोई भी कर्मचारी जिसे आग न दिखे","सबसे पहले अंदर लौटने वाला","सबसे अनुभवी पाली","नामित पर्यवेक्षक या अग्नि अधिकारी"]}',
   3,
   '{"en":"Absence of visible flame does not mean the area is safe.","hi":"आग न दिखने का मतलब क्षेत्र सुरक्षित होना नहीं है।"}'),

  ('fire-q5', 'fire',
   '{"en":"What is the first thing you should do on discovering a fire?","hi":"आग दिखने पर सबसे पहले क्या करना चाहिए?"}',
   '{"en":["Find an extinguisher","Raise the alarm","Photograph it for the report","Switch off the main power"],"hi":["अग्निशामक ढूँढें","अलार्म बजाएँ","रिपोर्ट के लिए फोटो लें","मुख्य बिजली बंद करें"]}',
   1,
   '{"en":"Raise the alarm first so everyone else can start evacuating.","hi":"पहले अलार्म बजाएँ ताकि बाकी सब निकलना शुरू कर सकें।"}'),

  ('gas-q1', 'gas',
   '{"en":"Your buddy collapses inside a confined space. What do you do?","hi":"आपका साथी सीमित स्थान में गिर जाता है। आप क्या करेंगे?"}',
   '{"en":["Enter immediately and pull them out","Hold your breath and go in","Raise the alarm and wait for trained rescuers","Enter wearing a dust mask"],"hi":["तुरंत अंदर जाकर बाहर खींचें","साँस रोककर अंदर जाएँ","अलार्म बजाएँ और प्रशिक्षित बचावकर्मियों की प्रतीक्षा करें","धूल का मास्क पहनकर अंदर जाएँ"]}',
   2,
   '{"en":"A majority of confined-space deaths are would-be rescuers.","hi":"सीमित स्थान में अधिकांश मौतें बचाने वालों की होती हैं।"}'),

  ('gas-q2', 'gas',
   '{"en":"Which PPE is required before approaching a toxic gas leak?","hi":"ज़हरीली गैस रिसाव के पास जाने से पहले कौन सा पीपीई आवश्यक है?"}',
   '{"en":["SCBA mask and gas-rated gloves","Dust mask and cotton gloves","Ear muffs and safety shoes","Face shield only"],"hi":["SCBA मास्क और गैस-रेटेड दस्ताने","धूल मास्क और सूती दस्ताने","कान के कवर और सुरक्षा जूते","केवल फेस शील्ड"]}',
   0,
   '{"en":"A dust mask filters particles, not gas.","hi":"धूल मास्क कण छानता है, गैस नहीं।"}'),

  ('gas-q3', 'gas',
   '{"en":"In the buddy system, what does the standby person do?","hi":"बडी सिस्टम में स्टैंडबाय व्यक्ति क्या करता है?"}',
   '{"en":["Enters with the entrant to help","Takes a break until called","Supervises from the control room","Stays outside, maintains contact, never enters"],"hi":["मदद के लिए प्रवेशकर्ता के साथ अंदर जाता है","बुलाए जाने तक आराम करता है","कंट्रोल रूम से निगरानी करता है","बाहर रहता है, संपर्क बनाए रखता है, कभी अंदर नहीं जाता"]}',
   3,
   '{"en":"If the standby enters, there is nobody left to raise the alarm.","hi":"यदि स्टैंडबाय अंदर जाए तो अलार्म बजाने वाला कोई नहीं बचता।"}'),

  ('gas-q4', 'gas',
   '{"en":"A gas cloud is drifting across the site. Which way do you evacuate?","hi":"गैस का बादल साइट पर फैल रहा है। आप किस दिशा में निकलेंगे?"}',
   '{"en":["Downwind, with the gas","Upwind, against the wind","Straight to the nearest exit","Downhill"],"hi":["हवा की दिशा में, गैस के साथ","हवा के विपरीत","सीधे निकटतम निकास की ओर","ढलान की ओर"]}',
   1,
   '{"en":"Move upwind. The nearest exit is wrong if it is downwind.","hi":"हवा के विपरीत जाएँ। यदि निकटतम निकास हवा की दिशा में है तो वह गलत है।"}'),

  ('gas-q5', 'gas',
   '{"en":"Before anyone enters a confined space, what must be done first?","hi":"किसी के सीमित स्थान में प्रवेश से पहले सबसे पहले क्या करना चाहिए?"}',
   '{"en":["Switch on the lights","Open all the valves","Test the atmosphere and issue a work permit","Inform the family"],"hi":["रोशनी चालू करें","सभी वाल्व खोलें","वातावरण की जाँच करें और कार्य अनुमति जारी करें","परिवार को सूचित करें"]}',
   2,
   '{"en":"Atmospheric testing and a signed entry permit are mandatory.","hi":"वातावरण की जाँच तथा हस्ताक्षरित प्रवेश अनुमति अनिवार्य है।"}')
on conflict (id) do update
  set question_text = excluded.question_text,
      options       = excluded.options,
      correct_index = excluded.correct_index,
      explanation   = excluded.explanation;

-- ------------------------------------------------------------ demo workers
-- Gives the dashboard a populated look on demo day (PRD 13: the safety officer
-- filters Ramu's department and it is not a table of one).
-- Ramu himself is created live during the demo, so he is NOT seeded here.

insert into public.workers (name, phone, department) values
  ('Sunita Devi',   '9800000001', 'mining'),
  ('Birsa Oraon',   '9800000002', 'mining'),
  ('Mohan Mahto',   '9800000003', 'mining'),
  ('Rekha Kumari',  '9800000004', 'processing'),
  ('Anil Soren',    '9800000005', 'steel'),
  ('Farid Ansari',  '9800000006', 'maintenance'),
  ('Lakhan Munda',  '9800000007', 'contract')
on conflict (phone) do nothing;

-- Give most of them a passing history so the compliance numbers look real.
insert into public.completions (worker_id, module_id, score, passed, attempts, completed_at)
select w.id, 'fire', 100, true, 1, now() - interval '9 days'
from public.workers w
where w.phone in ('9800000001', '9800000002', '9800000004', '9800000005')
  and not exists (
    select 1 from public.completions c where c.worker_id = w.id and c.module_id = 'fire'
  );

insert into public.completions (worker_id, module_id, score, passed, attempts, completed_at)
select w.id, 'fire', 60, false, 2, now() - interval '2 days'
from public.workers w
where w.phone = '9800000003'
  and not exists (
    select 1 from public.completions c where c.worker_id = w.id and c.module_id = 'fire'
  );

insert into public.certificates (worker_id, worker_name, department, module_id, score, issued_at, valid_until)
select w.id, w.name, w.department, 'fire', 100, now() - interval '9 days', now() + interval '356 days'
from public.workers w
where w.phone in ('9800000001', '9800000002', '9800000004')
  and not exists (
    select 1 from public.certificates c where c.worker_id = w.id and c.module_id = 'fire'
  );

-- One deliberately expired certificate, so the dashboard's "Expired" state and
-- the /verify EXPIRED banner are both demonstrable rather than theoretical.
insert into public.certificates (worker_id, worker_name, department, module_id, score, issued_at, valid_until)
select w.id, w.name, w.department, 'fire', 80, now() - interval '400 days', now() - interval '35 days'
from public.workers w
where w.phone = '9800000005'
  and not exists (
    select 1 from public.certificates c where c.worker_id = w.id and c.module_id = 'fire'
  );
