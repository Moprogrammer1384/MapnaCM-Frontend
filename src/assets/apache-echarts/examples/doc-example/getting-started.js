/*
 * Adapted from Apache ECharts examples (aebd221b302308af240b90267fd43b81657099a1).
 * Licensed under the Apache License 2.0.
 * Source: https://github.com/apache/echarts-examples
 */
option = {
  title: {
    text: 'ECharts Getting Started Example'
  },
  tooltip: {},
  legend: {
    data: ['sales']
  },
  xAxis: {
    data: ['Shirts', 'Cardigans', 'Chiffons', 'Pants', 'Heels', 'Socks']
  },
  yAxis: {},
  series: [
    {
      name: 'sales',
      type: 'bar',
      data: [5, 20, 36, 10, 10, 20]
    }
  ]
};
