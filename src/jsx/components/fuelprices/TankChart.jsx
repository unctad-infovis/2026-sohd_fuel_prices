import * as d3 from 'd3';
import { useEffect, useRef } from 'react';
import Block from './Block.jsx';
import { Accent, ChartHeader, ChartMeta } from './ChartParts.jsx';
import { easeOut4, esc, onceVisible, tween, useFuelData } from './helpers.js';

const TK = { CK: 3, G: 330, PARK: 552, PK: 1.15, PX: 250, START: -260 };

export default function TankChart() {
  const payload = useFuelData();
  const stageRef = useRef(null);
  const sceneRef = useRef(null);
  const incomeRef = useRef(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const income = incomeRef.current;
    if (!payload || !scene) return undefined;
    const { data: DATA, ill: ILL } = payload;
    const low = DATA.tank.find(t => t.g === 'Low income');
    const { CK, G, PARK, PK, PX, START } = TK;
    const ox = PX + 60 * PK;
    const oy = G - 179 * PK;
    const fx = PARK - 41 * CK;
    const fy = G - 21 * CK;
    const hk = PX + 59 * PK;
    const hy = G - 104 * PK;
    const parked = `M${ox} ${oy} C${ox + 40} ${oy + 46} ${hk + 46} ${G - 23} ${hk} ${hy}`;
    const active = `M${ox} ${oy} C${ox + 55} ${oy + 20} ${fx - 95} ${G + 6} ${fx} ${fy}`;
    // ILL holds the car and pump drawings as SVG markup
    scene.innerHTML = `<svg viewBox="0 0 760 360" role="img" aria-label="A car drives to a fuel pump; filling 40 litres of diesel now costs an extra 10% of a month's income in low-income countries">
    <rect class="tank_ground" x="0" y="${G}" width="760" height="7"/>
    <g transform="translate(${PX},${G}) scale(${PK})">${ILL.pump}
      <rect class="tank_display_box" x="-34" y="-161" width="54" height="30" rx="2"/><text class="tank_display" data-role="display" x="-7" y="-139" text-anchor="middle" style="font-size:20px">+0%</text></g>
    <path class="tank_hose" data-role="hose-parked" d="${parked}"/>
    <path class="tank_hose" data-role="hose-active" d="${active}" opacity="0"/>
    <path class="tank_flow" data-role="flow" d="${active}"/>
    <g data-role="car" transform="translate(${START},${G}) scale(${CK})">${ILL.carShadow}${ILL.carBody}<rect class="tank_cap" x="-42.4" y="-22.4" width="3.2" height="2.4" rx=".6"/>
      <g data-role="wheel-l">${ILL.wheelL}</g><g data-role="wheel-r">${ILL.wheelR}</g></g>
      </svg>`;
    const role = r => scene.querySelector(`[data-role="${r}"]`);
    const mxv = d3.max(DATA.tank, t => t.v);
    income.innerHTML = `<h4 class="income_title">Median by income group</h4>${DATA.tank
      .map(
        (t, i) =>
          `<div class="income_row${i === 0 ? ' income_row--low' : ''}"><div class="income_group">${esc(t.g.replace(' income', ''))}<small class="income_n">${t.n} economies</small></div><div class="income_bar" style="--fp-w:${((t.v / mxv) * 100).toFixed(1)}%"><span class="income_fill"></span><em class="income_value" data-v="${t.v}">+0.0%</em></div></div>`
      )
      .join('')}`;
    const hoseA = role('hose-active');
    const L = hoseA.getTotalLength();
    hoseA.style.strokeDasharray = L;
    hoseA.style.strokeDashoffset = L;
    const placeCar = xp => {
      role('car').setAttribute('transform', `translate(${xp},${G}) scale(${CK})`);
      const deg = (((xp - START) / (9.2 * CK)) * 180) / Math.PI;
      role('wheel-l').setAttribute('transform', `rotate(${deg} -30.5 -9.2)`);
      role('wheel-r').setAttribute('transform', `rotate(${deg} 31 -9.2)`);
    };
    const countBars = instant => {
      for (const [i, em] of [...income.querySelectorAll('.income_value')].entries()) {
        const to = Number(em.dataset.v);
        if (instant) {
          em.textContent = `+${to.toFixed(1)}%`;
          continue;
        }
        tween(
          1600,
          t => {
            em.textContent = `+${(to * easeOut4(t)).toFixed(1)}%`;
          },
          null,
          i * 300
        );
      }
    };
    let fuelled = false;
    const timers = [];
    const fuel = instant => {
      if (fuelled) return;
      fuelled = true;
      const disp = role('display');
      const flow = role('flow');
      const pct = Math.floor(low.v);
      role('hose-parked').style.opacity = 0;
      hoseA.setAttribute('opacity', 1);
      if (instant) {
        hoseA.style.strokeDashoffset = 0;
        disp.textContent = `+${pct}%`;
        income.classList.add('is-fuelled');
        countBars(true);
        return;
      }
      hoseA.style.transition = 'stroke-dashoffset .8s cubic-bezier(.16,1,.3,1)';
      requestAnimationFrame(() => {
        hoseA.style.strokeDashoffset = 0;
      });
      timers.push(
        setTimeout(() => {
          flow.classList.add('is-on');
          income.classList.add('is-fuelled');
          countBars(false);
          tween(
            2600,
            t => {
              disp.textContent = `+${Math.round(pct * easeOut4(t))}%`;
            },
            () => timers.push(setTimeout(() => flow.classList.remove('is-on'), 2400))
          );
        }, 850)
      );
    };
    placeCar(START);
    const stop = onceVisible(
      stageRef.current,
      instant => {
        if (instant) {
          placeCar(PARK);
          fuel(true);
          return;
        }
        tween(
          2400,
          t => placeCar(START + (PARK - START) * d3.easeCubicOut(t)),
          () => timers.push(setTimeout(() => fuel(false), 250)),
          300
        );
      },
      0.4
    );
    return () => {
      stop();
      for (const t of timers) clearTimeout(t);
    };
  }, [payload]);

  return (
    <Block className="block--tank" id="fp-tank" nav="Cost of a tank">
      <ChartHeader
        subtitle="Increase in the cost of 40 litres of diesel in per cent of monthly gross domestic product per capita."
        title={
          <>
            Filling a car tank now takes <Accent>an extra 10% of people’s income</Accent> in poor countries.
          </>
        }
      />
      <div className="tank" ref={stageRef}>
        <div className="tank_scene" ref={sceneRef} />
        <div className="income" ref={incomeRef} />
      </div>
      <ChartMeta
        note="Change of the local cost of 40 litres of diesel since the start of the Middle East conflict until 19 October 2026, compared to the six months before the conflict (weekly, 1 September 2025 – 23 February 2026) based on diesel prices and GDP in local currencies. Countries are classified according to the World Bank income groups."
        source="UN Trade and Development (UNCTAD), based on Global Petrol Prices, national sources, International Monetary Fund and World Bank."
      />
    </Block>
  );
}
