import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "混雑状況の確認",
  description: "混雑状況の確認",
};

export default function congestion() {
  return (
    <div>
      <h1>混雑状況の確認</h1>
      <div className="columnAlphabet flex flex-row gap-4">
        <div>&nbsp;</div>
        <div>A</div>
        <div>B</div>
        <div>C</div>
        <div>D</div>
        <div>E</div>
        <div>F</div>
        <div>G</div>
        <div>H</div>
        <div>I</div>
        <div>J</div>
      </div>
      <div className="rowNumber">
        <div>1</div>
        <div>2</div>
        <div>3</div>
        <div>4</div>
        <div>5</div>
        <div>6</div>
        <div>7</div>
        <div>8</div>
        <div>9</div>
        <div>10</div>
        <div>11</div>
        <div>12</div>
        <div>13</div>
        <div>14</div>
        <div>15</div>
        <div>16</div>
        <div>17</div>
        <div>18</div>
        <div>19</div>
        <div>20</div>
      </div>
    </div>
  );
}