import { useState } from 'react';
import Nav from './components/Nav';
import RedHero from './components/RedHero';
import Ecosystem from './components/Ecosystem';
import Program from './components/Program';
import Courses from './components/Courses';
import Enroll from './components/Enroll';
import Footer from './components/Footer';

export default function App() {
  const [courseId, setCourseId] = useState('full');

  const enroll = (id: string) => {
    setCourseId(id);
    document.getElementById('enroll')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div id="top" className="font-manrope">
      <Nav />
      <RedHero />
      <Ecosystem />
      <Program />
      <Courses onEnroll={enroll} />
      <Enroll courseId={courseId} onCourseChange={setCourseId} />
      <Footer />
    </div>
  );
}
