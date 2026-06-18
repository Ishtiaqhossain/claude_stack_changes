import { Report } from './report.js';

const report = new Report('Sales', [
  { label: 'Apples', value: 120 },
  { label: 'Oranges', value: 90 },
]);

console.log(report.render());
