import Nav from './components/Nav';
import Hero from './components/Hero';
import Idea from './components/Idea';
import About from './components/About';
import School from './components/School';
import Trust from './components/Trust';
import System from './components/System';
import Product from './components/Product';
import Process from './components/Process';
import Economics from './components/Economics';
import Cases from './components/Cases';
import Market from './components/Market';
import Offers from './components/Offers';
import Final from './components/Final';

export default function App() {
  return (
    <main style={{ background: '#0B0D10', overflowX: 'clip' }}>
      <Nav />
      <Hero />
      <Idea />
      <About />
      <School />
      <Trust />
      <System />
      <Product />
      <Process />
      <Economics />
      <Cases />
      <Market />
      <Offers />
      <Final />
    </main>
  );
}
