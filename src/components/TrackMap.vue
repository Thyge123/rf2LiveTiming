<template>
  <div class="trackMap">
    <svg style="width: 100%; height: 100%"></svg>
  </div>
</template>

<script>
const baseUrl = "http://192.168.1.62/rfactor2-api/rest/";
import * as d3 from "d3";

export default {
  name: "TrackMap",
  props: ["filteredStandings", "getCarClassColor"],
  data() {
    return {
      waypoints: [],
    };
  },
  methods: {
    async drawTrack() {
      await this.axios.get(baseUrl + "watch/trackmap").then((response) => {
        this.waypoints = response.data.filter(
          (waypoint) => waypoint.type === 0
        );
      });
      const line = d3
        .line()
        .curve(d3.curveCardinal) // Apply smoothing to the line
        .x((d) => {
          return d.x;
        })
        .y((d) => {
          return d.z;
        });

      // Generate the SVG path
      const pathData = line(this.waypoints);
      // Select the SVG container
      const svg = d3.select(".trackMap svg");

      // Append a 'g' element to the SVG, apply a scale transformation to it
      const g = svg.append("g").attr("transform", "scale(-0.9, 0.9)");

      // Append the path to the 'g' element
      const path = g
        .append("path")
        .attr("d", pathData)
        .attr("stroke", "white")
        .attr("fill", "none");

      // Get the bounding box of the path
      const bbox = path.node().getBBox();

      // Use the width and height from the bounding box to set the SVG width and height
      svg.attr("width", bbox.width).attr("height", bbox.height);
      svg.attr("viewBox", [bbox.x, bbox.y, bbox.width, bbox.height].join(" "));
    },
    drawCars() {
      const carPositions = this.filteredStandings.map((s) => ({
        ...s.carPosition,
        position: s.positionInCarClass,
        carClassColor: this.getCarClassColor(s.carClass),
      }));

      // Select the SVG container where the cars will be drawn
      const svg = d3.select(".trackMap svg");

      // Select the 'g' element if it exists, otherwise append a new one
      let g = svg.select("g");
      if (g.empty()) {
        g = svg.append("g").attr("transform", "scale(-0.9, 0.9)");
      }

      // Bind carPositions to the SVG circles and update their positions
      const circles = g.selectAll("circle").data(carPositions);
      circles
        .enter()
        .append("circle")
        .merge(circles)
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.z)
        .attr("r", Math.sqrt(100))
        .attr("fill", (d) => d.carClassColor); // Use the carClassColor property for the fill color
      circles.exit().remove(); // Remove any circles that are no longer needed

      // Bind carPositions to the SVG text elements and update their positions
      const texts = g.selectAll("text").data(carPositions);
      texts
        .enter()
        .append("text")
        .merge(texts)
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.z + 5.0)
        .text((d) => d.position)
        .attr("font-family", "sans-serif")
        .attr("font-size", "16px")
        .attr("fill", "white")
        .attr("text-anchor", "middle") // Center the text horizontally
        .attr(
          "transform",
          (d) =>
            `translate(${d.x}, ${
              d.z
            }) scale(-1, 1) translate(${-d.x}, ${-d.z}) `
        );

      texts.exit().remove(); // Remove any text elements that are no longer needed
    },
  },
  async mounted() {
    await this.drawTrack();
    this.drawCarsInterval = setInterval(() => {
      this.drawCars();
    }, 1000);
  },
  beforeDestroy() {
    clearInterval(this.drawCarsInterval);
  },
};
</script>

<style scoped>
.trackMap {
  height: 500px;
  flex-grow: 1; /* Allow the trackMap div to grow to fill available space */
  display: flex; /* Use Flexbox layout */
  justify-content: center; /* Center content horizontally */
  align-items: center; /* Center content vertically */
}

.trackMap svg {
  stroke-width: 6;
}
</style>
