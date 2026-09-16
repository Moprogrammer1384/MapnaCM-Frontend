/*
 * Adapted from Apache ECharts examples (aebd221b302308af240b90267fd43b81657099a1).
 * Licensed under the Apache License 2.0.
 * Source: https://github.com/apache/echarts-examples
 */
option = {
  series: [
    {
      type: 'scatter',
      data: [[0, 0]],
      symbolSize: 1,
      label: {
        show: true,
        formatter: [
          'The whole box is a {term|Text Block}, with',
          'red border and grey background.',
          '{fragment1|A Text Fragment} {fragment2|Another Text Fragment}',
          'Text fragments can be customized.'
        ].join('\n'),
        backgroundColor: '#eee',
        // borderColor: '#333',
        borderColor: 'rgb(199,86,83)',
        borderWidth: 2,
        borderRadius: 5,
        padding: 10,
        color: '#000',
        fontSize: 14,
        shadowBlur: 3,
        shadowColor: '#888',
        shadowOffsetX: 0,
        shadowOffsetY: 3,
        lineHeight: 30,
        rich: {
          term: {
            fontSize: 18,
            color: 'rgb(199,86,83)'
          },
          fragment1: {
            backgroundColor: '#000',
            color: 'yellow',
            padding: 5
          },
          fragment2: {
            backgroundColor: '#339911',
            color: '#fff',
            borderRadius: 15,
            padding: 5
          }
        }
      }
    }
  ],
  xAxis: {
    axisLabel: { show: false },
    axisLine: { show: false },
    splitLine: { show: false },
    axisTick: { show: false },
    min: -1,
    max: 1
  },
  yAxis: {
    axisLabel: { show: false },
    axisLine: { show: false },
    splitLine: { show: false },
    axisTick: { show: false },
    min: -1,
    max: 1
  }
};
