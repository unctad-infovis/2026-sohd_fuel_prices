import Article from '../Article.mdx';

import Footer from './components/fuelprices/Footer.jsx';
import FuelsChart from './components/fuelprices/FuelsChart.jsx';
import GapChart from './components/fuelprices/GapChart.jsx';
import GlobeTrio from './components/fuelprices/GlobeTrio.jsx';
import Header from './components/fuelprices/Header.jsx';
import Intro from './components/fuelprices/Intro.jsx';
import KeyConsiderations from './components/fuelprices/KeyConsiderations.jsx';
import MapScrolly from './components/fuelprices/MapScrolly.jsx';
import OilChart from './components/fuelprices/OilChart.jsx';
import ProgressBar from './components/fuelprices/ProgressBar.jsx';
import SlideNav from './components/fuelprices/SlideNav.jsx';
import Sprite from './components/fuelprices/Sprite.jsx';
import { CostStatement, PumpStatement } from './components/fuelprices/Statement.jsx';
import TagsChart from './components/fuelprices/TagsChart.jsx';
import TankChart from './components/fuelprices/TankChart.jsx';
import TornadoChart from './components/fuelprices/TornadoChart.jsx';

import '@unctad-infovis/general-tools/styles/styles.css';
import './App.css';
import './components/fuelprices/FuelPrices.css';

const components = {
  CostStatement,
  Footer,
  FuelsChart,
  GapChart,
  GlobeTrio,
  Header,
  Intro,
  KeyConsiderations,
  MapScrolly,
  OilChart,
  ProgressBar,
  PumpStatement,
  SlideNav,
  Sprite,
  TagsChart,
  TankChart,
  TornadoChart
};

const App = ({ meta }) => {
  return (
    <div className="app">
      <Article components={components} meta={meta} />
    </div>
  );
};

export default App;
