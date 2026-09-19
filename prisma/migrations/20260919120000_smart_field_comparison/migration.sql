-- A smart field may carry a baseline-vs-forecast comparison: two extra equations
-- evaluated with the same test inputs, rendered as the side-by-side bar chart
-- (Derek, 2026-09-19: "a way to create a baseline/forecast comparison chart").
ALTER TABLE "SmartField" ADD COLUMN "comparisonJson" JSONB;
