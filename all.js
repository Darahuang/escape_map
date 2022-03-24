/* global axios */
// 直轄市、縣市界線 (TWD97 經緯度) - TopoJSON 格式
const countyGeomapUrl = 'https://hexschool.github.io/tw_revenue/taiwan-geomap.json';
// 業績
const countyRevenueUrl = 'https://hexschool.github.io/tw_revenue/tw_revenue.json';

function getCountiesData() {
  return axios.get(countyGeomapUrl)
    .then((res) => res.data);
}
function getRevenueData() {
  return axios.get(countyRevenueUrl)
    .then((res) => res.data);
}

Promise.all([getCountiesData(), getRevenueData()])
  .then((data) => {
    const counties = topojson.feature(data[0], data[0].objects.COUNTY_MOI_1090820);
    const revenue = data[1][0].data;
    counties.features.forEach((county, index) => {
      revenue.forEach((item) => {
        if (county.properties.COUNTYNAME === item.city) {
          counties.features[index].properties.rank = item.rank;
          counties.features[index].properties.revenue = item.revenue.replace(/,/g, '');
        }
      });
    });
    const colorScale = d3
      .scaleLinear()
      .domain([
        // d3.min(revenue, (d) => d.revenue.replace(/,/g, '')),
        // d3.max(revenue, (d) => d.revenue.replace(/,/g, ''))
        d3.min(revenue, (d) => d.rank),
        d3.max(revenue, (d) => d.rank)
      ])
      .range([
        '#bcafb0', // <= the lightest shade we want
        '#ec595c' // <= the darkest shade we want
      ]);

    const svg = d3
      .select('#canvas')
      .append('svg')
      .style('height', '100vh')
      .style('width', '100%')
      .style('background-color', '#202d49');

    const tooltip = d3
      .select('#tooltip')
      .attr('fill', '#f3dc71')
      .style('position', 'absolute')
      .style('display', 'none')
      .style('font-size', '28px');

    d3.select('#canvas').on('mousemove', (e) => {
      tooltip.style('left', e.layerX + 20).style('top', e.layerY + 35);
    });

    const projection = d3.geoMercator().center([120, 25]).scale(10000);

    const path = d3.geoPath(projection);

    svg
      .selectAll('path')
      .data(counties.features)
      .join('path')
      .attr('d', path)
      // .attr('fill', (d) => colorScale(d.properties.revenue) || '#d6d6d6')
      .attr('fill', (d) => colorScale(d.properties.rank) || '#d6d6d6')
      .attr('stroke', '#3f2ab2')
      .attr('stroke-width', '1px')
      .on('mouseover', function () {
        d3.select(this).attr('stroke', '#f3dc71').attr('stroke-width', '2px');
        d3.select(this).select((d) => {
          tooltip.select('text').text(`${d.properties.COUNTYNAME}, ${d.properties.revenue ? d.properties.revenue : 0}`);
          tooltip.transition().style('display', 'block');
        });
      })
      .on('mouseleave', function () {
        d3.select(this).attr('stroke', '#3f2ab2').attr('stroke-width', '1px');
        tooltip.transition().style('display', 'none');
      });
  });
