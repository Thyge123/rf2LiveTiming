<script>
import * as d3 from "d3";
const baseUrl = "http://192.168.1.62/rfactor2-api/rest/";
export default {
  data() {
    return {
      isLoading: true,
      standings: [],
      fields: [
        { key: "inGarageStall", label: "" },
        "position",
        { key: "positionInCarClass", label: "PIC" },
        { key: "driverName", label: "Name" },
        { key: "carClass", label: "Class" },
        { key: "carImage", label: "" },
        { key: "fullTeamName", label: "Team" },
        { key: "lastLapTime", label: "Last" },
        { key: "bestLapTime", label: "Best" },
        "gap",
        { key: "gapToLeader", label: "Gap Leader" },

        { key: "lapsCompleted", label: "Laps" },
      ],
      carClassColor: {
        LMH: "#e02d2d",
        LMP2: "#006bd5",
        GTE: "#037539",
        GT3: "#FE5000",
      },
      randomColors: {},
      standings2: [],
      trackName: "",
      session: "",
      trackTemp: 0,
      airTemp: 0,
      minWetness: 0,
      maxWetNess: 0,
      avgWetNess: 0,
      yellowflags: [],
      inGarageStall: false,
      s1: false,
      s2: false,
      s3: false,
      currentEventTime: 0,
      endEventTime: 0,
      remaningTime: 0,
      coordinates: [],
      selectedCarClass: "Class: All",
      searchQuery: "",
      carImages: {},
      selectedCarClasses: [],
      maxLaps: 0,
      LeaderLaps: 0,
      errorMessage: null,
      hasConnection: true,
      trackData: [],
      waypoints: null,
      trackPath: "",
      carPaths: "",
    };
  },
  computed: {
    filteredStandings() {
      let standings = this.standings;
      if (this.selectedCarClasses.length > 0) {
        standings = standings.filter((s) =>
          this.selectedCarClasses.includes(s.carClass)
        );
      }
      return standings;
    },
    uniqueCarClasses() {
      const carClasses = new Set(this.standings.map((s) => s.carClass));
      return Array.from(carClasses);
    },
  },
  watch: {
    standings(newStandings, oldStandings) {
      const newCars = newStandings.filter(
        (newCar) =>
          !oldStandings.some((oldCar) => oldCar.carId === newCar.carId)
      );
      newCars.forEach((car) => this.getCarImage(car.carId));
    },
    session(newSession, oldSession) {
      if (newSession !== oldSession && this.currentEventTime === 0) {
        this.GenerateXMLResults();
      }
    },
    filteredStandings: {
      handler: function () {
        this.calculatePositionInCarClass();
      },
      deep: true,
    },
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
        .curve(d3.curveCardinal) // Change this line
        .x((d) => {
          return d.x;
        })
        .y((d) => {
          return d.z;
        });

      // Generate the SVG path
      const path = line(this.waypoints);

      this.trackPath = path;
    },
    drawCars() {
      const carPositions = this.standings.map((s) => ({
        ...s.carPosition,
        driverName: s.positionInCarClass,
        carClassColor: this.getCarClassColor(s.carClass), // Use the getCarClassColor method
      }));
      console.log(carPositions);

      // Select the SVG container where the cars will be drawn
      const svg = d3.select(".trackMap svg");

      // Bind carPositions to the SVG circles and update their positions
      svg
        .selectAll("circle")
        .data(carPositions)
        .join("circle")
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.z)
        .attr("r", Math.sqrt(100))
        .attr("fill", (d) => d.carClassColor); // Use the carClassColor property for the fill color

      // Bind carPositions to the SVG text elements and update their positions
      svg
        .selectAll("text")
        .data(carPositions)
        .join("text")
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.z + 2.5)
        .text((d) => d.driverName) // Use the driverName property for the text
        .attr("font-family", "sans-serif")
        .attr("font-size", "12px")
        .attr("fill", "white")
        .attr("text-anchor", "middle") // Center the text horizontally
        .attr(
          "transform",
          (d) =>
            `translate(${d.x}, ${d.z}) scale(-1, 1) translate(${-d.x}, ${-d.z})`
        );
    },
    async checkAPIConnection() {
      try {
        const response = await this.axios.get(
          "http://192.168.1.62/rfactor2-api/swagger/index.html"
        );
        return response.status === 200;
      } catch (error) {
        console.error("API connection error:", error);
        return false;
      }
    },
    async GetStandings() {
      try {
        await this.axios.get(baseUrl + "watch/standings").then((response) => {
          this.standings = response.data;
          this.standings.sort((a, b) => a.position - b.position);
          this.standings.forEach((element) => {
            element.lastLapTime = parseFloat(element.lastLapTime).toFixed(3);
            element.bestLapTime = parseFloat(element.bestLapTime).toFixed(3);
            element.gapToLeader = element.timeBehindLeader.toFixed(3);
            element.gap = element.timeBehindNext.toFixed(3);
            element.fullTeamName =
              "#" + element.carNumber + " " + element.fullTeamName;
          });
        });
        this.leaderLaps = this.standings[0].lapsCompleted;
        if (!this.session.includes("RACE")) {
          await this.calculateGap();
        } else {
          this.fields.push("pitstops");
        }
      } catch (error) {
        this.hasConnection = false;
        this.errorMessage =
          "An error occurred while getting session info. Please refresh the page. " +
          error.message;
      }
    },
    async getSessionInfo() {
      try {
        this.yellowflags = [];
        await this.axios.get(baseUrl + "watch/sessionInfo").then((response) => {
          this.trackName = response.data.trackName;
          this.session = response.data.session.slice(0, -1);
          this.trackTemp = parseFloat(response.data.trackTemp).toFixed(1);
          this.airTemp = parseFloat(response.data.ambientTemp).toFixed(1);
          this.currentEventTime = response.data.currentEventTime;
          this.remaningTime =
            response.data.endEventTime - response.data.currentEventTime;
          this.maxLaps = response.data.maximumLaps;
          this.remaningTime = secondsToHms(this.remaningTime);
          this.yellowflags.push(response.data.sectorFlag);
          for (let i = 0; i < 3; i++) {
            this[`s${i + 1}`] =
              this.yellowflags[i]?.includes("YELLOW") || false;
          }
        });
      } catch (error) {
        this.hasConnection = false;
        this.errorMessage =
          "An error occurred while getting session info. Please refresh the page.   " +
          error.message;
      }
    },
    async getCarImage(carId) {
      try {
        const dataUrl = await toDataURL(
          baseUrl + `/race/car/${carId}/image?type=IMAGE_THUMBNAIL`
        );
        this.carImages[carId] = dataUrl;
      } catch (error) {
        this.errorMessage = (`Failed to load image for car ${carId}:`, error);
      }
    },
    async calculateGap() {
      const leader = this.standings[0];
      this.standings.forEach((car, index) => {
        car.gapToLeader =
          index === 0 ? 0 : sec2time(car.bestLapTime - leader.bestLapTime);
      });

      this.standings.forEach((car, index) => {
        car.gap =
          index === 0
            ? 0
            : sec2time(car.bestLapTime - this.standings[index - 1].bestLapTime);
      });
      this.convertLapTime();
    },
    convertLapTime() {
      this.standings.forEach((element) => {
        element.lastLapTime = sec2time(element.lastLapTime);
        element.bestLapTime = sec2time(element.bestLapTime);
        if (
          element.lastLapTime.startsWith("-") ||
          element.lastLapTime.startsWith("00")
        ) {
          element.lastLapTime = "-";
          element.gap = "-";
        }
        if (element.bestLapTime.startsWith("-")) {
          element.bestLapTime = "-";
          element.gapToLeader = "-";
        }
        if (element.position === 1) {
          element.gapToLeader = "-";
          element.gap = "-";
        }
      });
    },
    async generateTrackMap() {
      try {
        await this.axios.get(baseUrl + "watch/trackmap").then((response) => {
          this.trackData = response.data.filter(
            (item) => item.type === 0 || item.type === 1
          );
          this.trackData = response.data;
          this.trackMap();
        });
        //this.generatePathData();
      } catch (error) {
        this.errorMessage =
          ("An error occurred while generating the track map:", error);
      }
    },

    getCarClassColor(carClass) {
      if (!this.randomColors[carClass]) {
        this.randomColors[carClass] = this.getRandomColor();
      }
      return this.carClassColor[carClass] || this.randomColors[carClass];
    },
    getRandomColor() {
      const letters = "0123456789ABCDEF";
      let color = "#";
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    },
    async calculatePositionInCarClass() {
      try {
        this.standings.forEach((driver) => {
          let sameClassDrivers = this.standings.filter(
            (d) => d.carClass === driver.carClass
          );
          let higherScoreDrivers = sameClassDrivers.filter(
            (d) => d.position < driver.position
          );
          this.$set(
            driver,
            "positionInCarClass",
            higherScoreDrivers.length + 1
          );
        });
      } catch (error) {
        (this.errorMessage =
          "An error occurred while calculating the position in car class:"),
          error;
      }
    },
    async GenerateXMLResults() {
      try {
        await this.axios
          .get("https://localhost:7190/api/rF2XML")
          .then((response) => {
            console.log(response.data);
          });
      } catch (error) {
        this.errorMessage =
          ("An error occurred while generating XML results:", error.message);
      }
    },
  },
  async created() {
    await this.checkAPIConnection();
    await this.drawTrack();
    await this.getSessionInfo();
    await this.GetStandings();
    await this.getCarImage();
    await this.calculatePositionInCarClass();
    this.isLoading = false;
  },

  mounted: async function () {
    if (await this.checkAPIConnection()) {
      this.sessionInfoInterval = setInterval(() => {
        this.getSessionInfo();
        this.GetStandings();
        this.drawCars();
      }, 1000);
    }
  },

  beforeDestroy() {
    clearInterval(this.sessionInfoInterval);
  },
};

const toDataURL = (url) =>
  fetch(url)
    .then((response) => response.blob())
    .then(
      (blob) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
    );

function secondsToHms(d) {
  d = Number(d);
  var h = Math.floor(d / 3600);
  var m = Math.floor((d % 3600) / 60);
  var s = Math.floor((d % 3600) % 60);

  var hDisplay = h > 0 ? h + (h == 1 ? ":" : "  ") : "";
  var mDisplay = m > 0 ? m + (m == 1 ? "  " : ":") : "";
  var sDisplay = s > 0 ? (s < 10 ? "0" + s : s) + (s == 1 ? " " : " ") : "";
  return hDisplay + mDisplay + sDisplay;
}
function sec2time(timeInSeconds) {
  var pad = function (num, size) {
      return ("000" + num).slice(size * -1);
    },
    time = parseFloat(timeInSeconds).toFixed(3),
    minutes = Math.floor(time / 60) % 60,
    seconds = Math.floor(time - minutes * 60),
    milliseconds = time.slice(-3);

  return pad(minutes, 2) + ":" + pad(seconds, 2) + "." + pad(milliseconds, 3);
}
</script>

<template>
  <div v-if="isLoading">
    <div class="container-fluid">
      <div class="text-center">
        <b-spinner></b-spinner>
      </div>
    </div>
  </div>
  <div v-else-if="errorMessage" class="error-message">
    <div class="container-fluid">
      <div class="text-center">
        {{ errorMessage }}
      </div>
    </div>
  </div>
  <div class="container-fluid" v-else>
    <div class="row">
      <div class="card text-white bg-dark">
        <div class="card-body">
          <div class="trackName">
            <div class="row">
              <div class="col-md-8">
                <p>Track: {{ trackName }}</p>
              </div>
              <div
                class="col-md-4"
                style="text-align: end"
                v-if="maxLaps > 1000"
              >
                <p>
                  <font-awesome-icon
                    icon="fa-solid fa-clock"
                    style="transform: scale(1); margin-right: 1%"
                  />{{ remaningTime }}
                </p>
              </div>
              <div class="col-md-4" style="text-align: end" v-else>
                <p>{{ leaderLaps }} / {{ maxLaps }} Laps</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="card text-white bg-dark">
        <div class="card-body">
          <div class="row">
            <div class="col-md-4" style="align-self: center">
              <p style="font-size: 1.5rem; font-weight: bolder">
                Session: {{ session }}
              </p>
            </div>
            <div class="col-md-4">
              <div class="sectors">
                <div class="square" v-if="s1" style="background-color: yellow">
                  <p>S1</p>
                </div>
                <div
                  class="square"
                  v-else
                  style="background-color: rgb(18, 197, 0)"
                >
                  <p>S1</p>
                </div>
                <div class="square" v-if="s2" style="background-color: yellow">
                  <p>S2</p>
                </div>
                <div
                  class="square"
                  v-else
                  style="background-color: rgb(18, 197, 0)"
                >
                  <p>S2</p>
                </div>
                <div class="square" v-if="s3" style="background-color: yellow">
                  <p>S3</p>
                </div>
                <div
                  class="square"
                  v-else
                  style="background-color: rgb(18, 197, 0)"
                >
                  <p>S3</p>
                </div>
              </div>
            </div>
            <div class="col-md-4" style="align-self: center; text-align: end">
              <p style="font-size: 1.5rem; font-weight: bolder">
                Ambient Temp: {{ airTemp }}°C / Track Temp: {{ trackTemp }}°C
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="row" style="height: 400px">
      <div class="card text-white bg-dark">
        <div class="card-body">
          <div class="trackMap">
            <svg>
              <path :d="trackPath" stroke="white" fill="none"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="card text-white bg-dark">
        <div class="card-body">
          <div class="col-md-1">
            <b-dropdown
              id="dropdown-1"
              text="Select Car Classes"
              class="m-md-2"
            >
              <b-form-checkbox-group v-model="selectedCarClasses" stacked>
                <b-form-checkbox
                  v-for="carClass in uniqueCarClasses"
                  :key="carClass"
                  :value="carClass"
                  class="moveCheckBoxText"
                >
                  {{ carClass }}
                </b-form-checkbox>
              </b-form-checkbox-group>
            </b-dropdown>
          </div>
          <b-table
            striped
            hover
            dark
            borderless
            :items="filteredStandings"
            :fields="fields"
          >
            <template #cell(carClass)="data">
              <div
                :style="{
                  'background-color': getCarClassColor(data.value),
                  'text-align-last': 'center',
                  padding: '10px 0px !important',
                  width: '120px !important',
                  display: 'inline-block',
                }"
                v-text="data.value"
              ></div>
            </template>
            <template v-slot:cell(carImage)="data">
              <img v-bind:src="carImages[data.item.carId]" />
            </template>
            <template #cell(inGarageStall)="data">
              <p
                v-if="data.value === true"
                style="
                  display: inline-block;
                  width: 30px;
                  border-radius: 5px 5px 5px 5px;
                  background-color: red;
                  text-align-last: center;
                  margin-bottom: 0px;
                "
              >
                P
              </p>
            </template>
            <template #head(positionInCarClass)="data">
              <span v-b-tooltip.hover title="Position in class">
                {{ data.label }}
              </span>
            </template>
          </b-table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sectors {
  display: flex;
  height: 55px;
  justify-content: center;
  gap: 10px;
}
.sectors p {
  padding-top: 0.75rem;
  font-weight: bolder;
  font-size: large;
}

.trackName p {
  font-size: 1.5rem;
  font-weight: bolder;
}

.square {
  height: 50px;
  width: 150px;
  color: rgb(0, 0, 0);
  text-align: center;
  border-radius: 5px 5px 5px 5px;
}

img {
  height: 40px;
}

table,
td {
  text-align: center;
  vertical-align: middle;
}

.moveCheckBoxText {
  padding-left: 10px;
}

.dark-checkbox {
  background-color: #212529;
  color: #fff;
}

::v-deep table,
::v-deep td {
  font-weight: bold; /* Make the text bolder */
}

.error-message {
  color: red;
  font-weight: bold;
}

svg {
  overflow: visible;
  transform: rotate(-25deg) scale(-0.6, 0.6);
  top: 225px;
  stroke-width: 0.25em;
}

.trackMap {
  display: flex;
  justify-content: center;
  align-items: center;
  right: 140px;
}
</style>
