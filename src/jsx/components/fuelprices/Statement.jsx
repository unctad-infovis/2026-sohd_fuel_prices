import Block from './Block.jsx';

export function PumpStatement() {
  return (
    <Block className="block--statement">
      <h2 className="statement statement--wide">
        Around the world, people are facing
        <br /> <span className="statement_accent">higher fuel prices at the pump</span>.
      </h2>
    </Block>
  );
}

export function CostStatement() {
  return (
    <Block className="block--statement">
      <h2 className="statement">
        These price increases make <span className="statement_accent">everyday life more expensive</span>.
      </h2>
    </Block>
  );
}
