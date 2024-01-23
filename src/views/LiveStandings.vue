<script>
import TrackMap from "../components/TrackMap.vue";
const baseUrl = "http://192.168.1.62/rfactor2-api/rest/";
export default {
  components: {
    TrackMap,
  },
  data() {
    return {
      isLoading: true,
      standings: [],
      fields: [
        { key: "pitting", label: "" },
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
      newSectorFlags: [],
      inGarageStall: false,
      s1: false,
      s2: false,
      s3: false,
      currentEventTime: 0,
      endEventTime: 0,
      remaningTime: 0,
      selectedCarClass: "Class: All",
      searchQuery: "",
      carImages: {},
      selectedCarClasses: [],
      maxLaps: 0,
      LeaderLaps: 0,
      errorMessage: null,
      hasConnection: true,
    };
  },
  computed: {
    // Filter the standings based on the selected car classes
    filteredStandings() {
      let standings = this.standings;
      if (this.selectedCarClasses.length > 0) {
        standings = standings.filter((s) =>
          this.selectedCarClasses.includes(s.carClass)
        );
      }
      return standings;
    },
    // Get the unique car classes from the standings
    uniqueCarClasses() {
      // Create a Set from the car classes
      const carClasses = new Set(this.standings.map((s) => s.carClass));
      // Convert the Set to an Array and return it
      return Array.from(carClasses);
    },
  },
  watch: {
    // Watch for changes in the standings and update the car images
    standings(newStandings, oldStandings) {
      const newCars = newStandings.filter(
        (newCar) =>
          !oldStandings.some((oldCar) => oldCar.carId === newCar.carId)
      );
      newCars.forEach((car) => this.getCarImage(car.carId));
    },
    // Watch for changes in the filtered standings and update the position in car class
    filteredStandings: {
      handler: function () {
        this.calculatePositionInCarClass();
      },
      deep: true,
    },
  },

  methods: {
    // Check if the API is reachable
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

    // Get the standings from the API
    async GetStandings() {
      try {
        await retry(() => this.axios.get(baseUrl + "watch/standings")).then(
          (response) => {
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
          }
        );
        this.leaderLaps = this.standings[0]?.lapsCompleted;
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
    // Get the session info from the API
    async getSessionInfo() {
      try {
        await retry(() => this.axios.get(baseUrl + "watch/sessionInfo")).then(
          (response) => {
            this.trackName = response.data.trackName;
            this.session = response.data.session.slice(0, -1);
            this.trackTemp = parseFloat(response.data.trackTemp).toFixed(1);
            this.airTemp = parseFloat(response.data.ambientTemp).toFixed(1);
            this.currentEventTime = response.data.currentEventTime;
            this.remaningTime =
              response.data.endEventTime - response.data.currentEventTime;
            this.maxLaps = response.data.maximumLaps;
            this.remaningTime = secondsToHms(this.remaningTime);
            this.yellowflags = response.data.sectorFlag;
          }
        );
      } catch (error) {
        this.hasConnection = false;
        this.errorMessage =
          "An error occurred while getting session info. Please refresh the page.   " +
          error.message;
      }
    },
    // Get the car image from the API
    async getCarImage(carId) {
      try {
        // Get the data URL for the car image
        const dataUrl = await toDataURL(
          baseUrl + `/race/car/${carId}/image?type=IMAGE_THUMBNAIL`
        );
        // Set the car image in the carImages object
        this.carImages[carId] = dataUrl;
      } catch (error) {
        this.errorMessage = (`Failed to load image for car ${carId}:`, error);
      }
    },
    // Calculate the gap to leader and the gap to the car in front for each driver
    async calculateGap() {
      const leader = this.standings[0];
      this.standings.forEach((car, index) => {
        // Calculate the gap to the leader for each driver
        car.gapToLeader =
          index === 0 ? 0 : sec2time(car.bestLapTime - leader.bestLapTime);
      });

      this.standings.forEach((car, index) => {
        // Calculate the gap to the car in front for each driver
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
    //
    getCarClassColor(carClass) {
      // Check if there's already a color assigned for the given car class in the randomColors object
      if (!this.randomColors[carClass]) {
        // If not, generate a random color and assign it to the car class in the randomColors object
        this.randomColors[carClass] = this.getRandomColor();
      }
      // Return the color for the car class from the carClassColor object if it exists,
      // otherwise return the color from the randomColors object
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
    // Calculate the position in car class for each driver
    async calculatePositionInCarClass() {
      try {
        this.standings.forEach((driver) => {
          // Filter the standings to get drivers in the same car class
          let sameClassDrivers = this.standings.filter(
            (d) => d.carClass === driver.carClass
          );
          // Filter the same class drivers to get drivers with a higher position
          let higherScoreDrivers = sameClassDrivers.filter(
            (d) => d.position < driver.position
          );
          // Set the position in car class for the driver as the number of drivers with a higher position plus one
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
  },
  async created() {
    await this.checkAPIConnection();
    await this.getSessionInfo();
    await this.GetStandings();
    await this.getCarImage();
    await this.calculatePositionInCarClass();
    this.isLoading = false;
  },
  mounted: async function () {
    if (await this.checkAPIConnection()) {
      this.sessionInfoInterval = setInterval(async () => {
        try {
          await retry(() => this.getSessionInfo());
          await retry(() => this.GetStandings());
        } catch (error) {
          console.error("Error in API call:", error);
        }
      }, 1000);
    }
  },
  beforeDestroy() {
    clearInterval(this.sessionInfoInterval);
  },
};

const toDataURL = (url) =>
  // Fetch the resource from the provided URL
  fetch(url)
    // Once the response is received, convert it to a Blob
    .then((response) => response.blob())
    .then(
      (blob) =>
        // Create a new Promise to handle the next steps
        new Promise((resolve, reject) => {
          // Create a new FileReader object
          const reader = new FileReader();
          // When the reader has finished loading, resolve the Promise with the reader's result
          reader.onloadend = () => resolve(reader.result);
          // If an error occurs while reading, reject the Promise
          reader.onerror = reject;
          // Start reading the blob as a data URL
          reader.readAsDataURL(blob);
        })
    );

function secondsToHms(d) {
  d = Number(d);
  var h = Math.floor(d / 3600);
  var m = Math.floor((d % 3600) / 60);
  var s = Math.floor((d % 3600) % 60);

  var hDisplay = h > 0 ? h + (h == 1 ? ":" : "  ") : "";
  var mDisplay = m > 0 ? m + (m == 1 ? ":" : ":") : "";
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
async function retry(fn, retriesLeft = 5, interval = 1000) {
  try {
    return await fn(); // axios.get(url)
  } catch (error) {
    if (retriesLeft) {
      // Wait for a bit before retrying
      await new Promise((resolve) => setTimeout(resolve, interval));
      // Try again
      return retry(fn, retriesLeft - 1, interval);
    } else {
      // If no retries left, throw error
      throw error;
    }
  }
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
                <div
                  v-for="(flag, index) in yellowflags"
                  :key="index"
                  class="sector-box"
                  :class="{
                    yellow: flag === 'YELLOW',
                    green: flag != 'YELLOW',
                  }"
                >
                  <p>S{{ index + 1 }}</p>
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
    <div class="row">
      <div class="card text-white bg-dark">
        <div class="card-body">
          <TrackMap
            :filteredStandings="filteredStandings"
            :getCarClassColor="getCarClassColor.bind(this)"
          />
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
            <template #cell(pitting)="data">
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

.sector-box {
  height: 50px;
  width: 150px;
  text-align: center;
  border-radius: 5px 5px 5px 5px;
  margin: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.sector-box.yellow {
  background-color: yellow;
}
.sector-box.green {
  background-color: rgb(18, 197, 0);
}

.sector-box p {
  font-size: 1.5rem;
  font-weight: bolder;
  color: #000;
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

.trackMap {
  height: 500px;
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.trackMap svg {
  stroke-width: 6;
}
</style>
