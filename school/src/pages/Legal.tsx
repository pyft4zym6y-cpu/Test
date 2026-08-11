import { SCHOOL } from '../data/school';
import { PageHead, Section } from '../components/comic';

function LegalBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mb-10">
      <h2 className="font-oswald font-bold uppercase text-xl mb-3">{title}</h2>
      <ul className="flex flex-col gap-2">
        {items.map((t) => (
          <li key={t} className="text-[14.5px] leading-relaxed text-ink/75 pl-5 relative">
            <span className="absolute left-0 text-brand font-extrabold">—</span>
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Privacy() {
  return (
    <>
      <PageHead eyebrow="Документи" title="Політика конфіденційності" />
      <Section className="!pt-6 max-w-none">
        <div className="max-w-3xl">
          <p className="text-[15px] leading-relaxed font-semibold mb-10">
            Ця політика пояснює, які дані збирає школа {SCHOOL.name}, для чого вони
            використовуються і як їх видалити. Коротко: збираємо мінімум, не продаємо нікому,
            видаляємо на запит.
          </p>
          <LegalBlock
            title="1. Які дані ми збираємо"
            items={[
              'Дані заявки: імʼя, email або телефон, обраний курс, коментар.',
              'Технічні дані відвідування сайту (стандартні журнали хостингу).',
            ]}
          />
          <LegalBlock
            title="2. Для чого використовуємо"
            items={[
              'Звʼязатися з вами щодо запису на курс і підбору рівня.',
              'Надіслати інформацію про програму, розклад і умови навчання.',
              'Ми не передаємо дані третім особам і не використовуємо їх для сторонньої реклами.',
            ]}
          />
          <LegalBlock
            title="3. Зберігання і видалення"
            items={[
              'Дані заявок зберігаються в поштовій скриньці школи і не довше, ніж потрібно для комунікації.',
              `Щоб видалити свої дані, напишіть на ${SCHOOL.contacts.email} — видалимо протягом 30 днів.`,
            ]}
          />
          <LegalBlock
            title="4. Контакти"
            items={[
              `З питань цієї політики: ${SCHOOL.contacts.email}.`,
              `Відповідальна особа — ${SCHOOL.founder.name}, засновник школи.`,
            ]}
          />
        </div>
      </Section>
    </>
  );
}

export function Terms() {
  return (
    <>
      <PageHead eyebrow="Документи" title="Публічна оферта" />
      <Section className="!pt-6">
        <div className="max-w-3xl">
          <p className="text-[15px] leading-relaxed font-semibold mb-10">
            Ця оферта визначає умови надання освітніх послуг школою {SCHOOL.name}. Залишаючи заявку
            та оплачуючи навчання, ви приймаєте ці умови.
          </p>
          <LegalBlock
            title="1. Предмет"
            items={[
              'Школа надає доступ до навчальної програми: рівні, модулі, екзаменаційні питання і чек-листи компетенцій за обраним курсом.',
              'Перелік курсів, їх обсяг і зміст наведені на сторінці «Курси».',
            ]}
          />
          <LegalBlock
            title="2. Порядок запису та оплати"
            items={[
              'Запис здійснюється через заявку на сайті або напряму контактами школи.',
              'Вартість, формат і графік узгоджуються індивідуально до початку навчання.',
              'Навчання починається після підтвердження запису та оплати.',
            ]}
          />
          <LegalBlock
            title="3. Права та обовʼязки"
            items={[
              'Школа зобовʼязується надати матеріали програми у заявленому обсязі.',
              'Учасник зобовʼязується не поширювати навчальні матеріали третім особам.',
              'Усі матеріали програми є інтелектуальною власністю школи.',
            ]}
          />
          <LegalBlock
            title="4. Реквізити та звʼязок"
            items={[
              `${SCHOOL.founder.name} — засновник школи ${SCHOOL.name}.`,
              `Email: ${SCHOOL.contacts.email} · Телефон: ${SCHOOL.contacts.phone}.`,
            ]}
          />
        </div>
      </Section>
    </>
  );
}
