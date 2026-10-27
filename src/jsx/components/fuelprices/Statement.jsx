import Block from './Block.jsx';

export function PumpStatement() {
  return (
    <Block className="hz_block--statement" tinted>
      <h2 className="hz_statement hz_statement--wide">
        Around the world, people are facing
        <br /> <span className="hz_statement_accent">higher fuel prices at the pump</span>.
      </h2>
    </Block>
  );
}

export function CostStatement() {
  return (
    <Block className="hz_block--statement" tinted>
      <h2 className="hz_statement">
        These price increases make <span className="hz_statement_accent">everyday life more expensive</span>.
      </h2>
    </Block>
  );
}
