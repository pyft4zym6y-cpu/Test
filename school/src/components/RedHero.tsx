import { motion } from 'motion/react';

// Секция-манифест — точно по дизайн-спецификации (красный #FF0000, видео снизу)
export default function RedHero() {
  return (
    <section className="relative min-h-screen w-full bg-[#FF0000] flex flex-col z-10">
      <div className="flex-1 flex flex-col items-center w-full pt-[100px] md:pt-[400px]">
        <div className="flex flex-col items-center w-full px-8 text-center z-20 relative max-w-[900px] h-auto md:h-[620px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="mb-12"
          >
            <svg
              width="80"
              height="80"
              viewBox="0 0 120 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M60 120C26.8629 120 0 93.1371 0 60V0C22.5654 0 42.2213 12.4569 52.4662 30.8691C38.4788 34.2089 28.0787 46.7902 28.0787 61.8006V63.1443C28.0787 79.9648 41.7146 93.6006 58.5353 93.6006H59.8789L59.8785 61.8006C59.8785 79.3633 74.1159 93.6006 91.6787 93.6006L91.6787 61.8006C91.6787 44.2783 77.5071 30.0661 60 30.0008L60 0H62.5352C94.2722 0 120 25.7279 120 57.4648V60C120 93.1371 93.1371 120 60 120Z"
                fill="white"
              />
            </svg>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
            className="text-white text-[16px] h-[100px] w-full max-w-[400px] leading-[1.6] mb-[40px] uppercase tracking-wider mx-auto"
          >
            Ми створили цю школу з єдиною метою — прибрати хаос з e-commerce і виховати нове
            покоління архітекторів цифрового бізнесу
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.3, ease: 'easeOut' }}
            className="font-marck text-white text-[120px] leading-none mb-[32px]"
          >
            П.С.
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45, ease: 'easeOut' }}
            className="text-white leading-[1.6] mb-[100px] md:mb-24 w-full flex flex-col items-center font-light"
          >
            <p className="mb-[24px] text-[16px] w-[400px] max-w-full text-center">
              Я втомився від навчання, що вимагає більше зусиль, ніж дає результату. Тому програма
              школи зібрана з реальної практики — аудитів і трансформацій живих інтернет-магазинів.
            </p>
            <p className="text-[16px] w-[400px] max-w-full text-center">
              Бізнес має служити вашому життю, а не поглинати його. Опануйте архітектуру
              e-commerce — і система працюватиме на вас, поки ви фокусуєтеся на візії.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="relative w-full shrink-0">
        <div className="absolute top-0 left-0 w-full h-[100px] bg-gradient-to-b from-[#FF0000] to-transparent z-10 pointer-events-none" />
        <video autoPlay loop muted playsInline className="w-full h-auto block object-contain">
          <source
            src="https://res.cloudinary.com/daklr2whx/video/upload/v1778602552/track-video_2_s9lp53.mp4"
            type="video/mp4"
          />
        </video>
      </div>
    </section>
  );
}
