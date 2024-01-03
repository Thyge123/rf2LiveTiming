<script>
export default {
  data() {
    return {
      isLoading: true,
      tracks: [],
      trackCourse: "",
      fields: [
        { key: "details", label: "" },
        { key: "position", label: "POS" },
        { key: "ClassPosition", label: "PIC" },
        { key: "carClass", label: "Class" },
        { key: "Name", label: "Name" },
        { key: "vehName", label: "Description" },
        { key: "carType", label: "Car" },
        { key: "sector1", label: "Sector 1" },
        { key: "sector2", label: "Sector 2" },
        { key: "sector3", label: "Sector 3" },
        { key: "bestLapTime", label: "Lap Time" },
        { key: "fuel", label: "Fuel" },
        { key: "totalLaps", label: "Laps" },
      ],
      standings: [],
      carClassColor: {
        LMH: "#e02d2d",
        LMP2: "#006bd5",
        GTE: "#037539",
        GT3: "#FE5000",
        Championship: "#037539",
      },
      randomColors: {},
      selectedCarClass: "Class: All",
      searchQuery: "",
      errorMessage: null,
    };
  },
  computed: {
    filteredStandings() {
      let standings = this.standings;
      if (this.selectedCarClass !== "Class: All") {
        standings = standings.filter(
          (s) => s.carClass === this.selectedCarClass
        );
      }
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        standings = standings.filter((s) =>
          s.Name.toLowerCase().includes(query)
        );
      }
      return standings;
    },
    uniqueCarClasses() {
      const carClasses = new Set(this.standings.map((s) => s.carClass));
      return ["Class: All", ...Array.from(carClasses)];
    },
  },
  methods: {
    async GetRecords() {
      try {
        await this.axios
          .get(`https://localhost:7190/api/Track/laps/${this.trackCourse}`)
          .then((response) => {
            console.log(response.data);
            this.standings = response.data;
            this.standings.sort((a, b) => a.lapTime - b.lapTime);
            const driverLaps = {};
            this.standings.forEach((element) => {
              element.bestLapTime = sec2time(element.lapTime);
              element.Name = `${element.driverFirstName} ${element.driverLastName}`;
              element.sector1 = parseFloat(element.sector1).toFixed(3);
              element.sector2 = parseFloat(element.sector2).toFixed(3);
              element.sector3 = parseFloat(element.sector3).toFixed(3);
              element.fuel = parseFloat(element.fuel * 100).toFixed(0);
              if (!driverLaps[element.Name]) {
                driverLaps[element.Name] = {
                  ...element,
                  laps: [
                    {
                      lapTime: sec2time(element.lapTime),
                      sector1: element.sector1,
                      sector2: element.sector2,
                      sector3: element.sector3,
                      fuel: element.fuel,
                      car: element.carType,
                    },
                  ],
                };
              } else {
                // Check if a lap with the same details already exists
                const existingLap = driverLaps[element.Name].laps.find(
                  (lap) =>
                    lap.lapTime === sec2time(element.lapTime) &&
                    lap.sector1 === element.sector1 &&
                    lap.sector2 === element.sector2 &&
                    lap.sector3 === element.sector3 &&
                    lap.fuel === element.fuel &&
                    lap.car === element.carType
                );

                // Only add the new lap if it doesn't already exist
                if (!existingLap) {
                  driverLaps[element.Name].laps.push({
                    lapTime: sec2time(element.lapTime),
                    sector1: element.sector1,
                    sector2: element.sector2,
                    sector3: element.sector3,
                    fuel: element.fuel,
                    car: element.carType,
                  });
                }
              }
            });

            this.standings = Object.values(driverLaps);
            this.standings.sort((a, b) => a.bestLapTime - b.bestLapTime);
            this.standings.forEach((element, index) => {
              element.position = index + 1;
              element.totalLaps = element.laps.length;
            });
          });
      } catch (error) {
        this.errorMessage = error;
      }
    },
    rowClicked(item, index) {
      this.$set(
        this.standings[index],
        "_showDetails",
        !this.standings[index]._showDetails
      );
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
    getClassPosition(driver) {
      const sortedStandings = [...this.standings]
        .filter((d) => d.carClass === driver.carClass)
        .sort((a, b) => a.position - b.position);
      return sortedStandings.findIndex((d) => d.Name === driver.Name) + 1;
    },
    getBestLapTimeInClassColor(item) {
      const bestLapTimeInClass = Math.min(
        ...this.standings
          .filter((s) => s.carClass === item.carClass)
          .map((s) => this.time2sec(s.bestLapTime))
      );
      return this.time2sec(item.bestLapTime) === bestLapTimeInClass
        ? "#BC16BC"
        : "inherit";
    },
    time2sec(time) {
      const [minutes, seconds, milliseconds] = time.split(/[:.]/).map(Number);
      return minutes * 60 + seconds + milliseconds / 1000;
    },
  },
  created() {
    this.trackCourse = this.$route.params.trackVenue;
    this.GetRecords();
    this.isLoading = false;
  },
};
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
  <div class="container-fluid" v-else>
    <div class="row">
      <div class="card text-white bg-dark">
        <div class="card-body">
          <div class="row">
            <H2>Track Records: {{ trackCourse }}</H2>
          </div>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="card text-white bg-dark">
        <div class="card-body">
          <div class="row">
            <div class="col-md-1">
              <b-form-select v-model="selectedCarClass" style="height: 100%">
                <option
                  v-for="carClass in uniqueCarClasses"
                  :key="carClass"
                  :value="carClass"
                >
                  {{ carClass }}
                </option>
              </b-form-select>
            </div>
            <div class="col-md-2">
              <b-form-input
                v-model="searchQuery"
                placeholder="Search for a driver"
              ></b-form-input>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="card text-white bg-dark">
        <div class="card-body">
          <b-table
            striped
            hover
            dark
            borderless
            :items="filteredStandings"
            :fields="fields"
          >
            @row-clicked="rowClicked" >
            <template #cell(carClass)="data">
              <div
                :style="{
                  'background-color': getCarClassColor(data.value),
                  'text-align-last': 'center',
                  padding: '10px 0px !important',
                  width: '40% !important',
                  display: 'inline-block',
                }"
                v-text="data.value"
              ></div>
            </template>
            <template #cell(fuel)="data">
              <div v-text="data.value + '%'" style="font-weight: bold"></div>
            </template>
            <template #head(position)="data">
              <span v-b-tooltip.hover title="Position">
                {{ data.label }}
              </span>
            </template>
            <template #head(ClassPosition)="data">
              <span v-b-tooltip.hover title="Position in class">
                {{ data.label }}
              </span>
            </template>
            <template #cell(ClassPosition)="{ item }">
              <div style="font-weight: bold">
                {{ getClassPosition(item) }}
              </div>
            </template>
            <template #cell(bestLapTime)="data">
              <div
                :style="{
                  color: getBestLapTimeInClassColor(data.item),
                  fontWeight: 'bold',
                }"
              >
                {{ data.value }}
              </div>
            </template>
            <template #cell(details)="row">
              <b-button @click="row.toggleDetails">
                {{ row.detailsShowing ? "-" : "+" }}
              </b-button>
            </template>
            <template #row-details="{ item }">
              <div class="card text-white bg-dark">
                <div class="card-body">
                  <b-table
                    striped
                    dark
                    borderless
                    :items="item.laps"
                    :fields="[
                      'lap',
                      { key: 'car', label: 'Car' },
                      { key: 'sector1', label: 'Sector 1' },
                      { key: 'sector2', label: 'Sector 2' },
                      { key: 'sector3', label: 'Sector 3' },
                      { key: 'lapTime', label: 'Lap Time' },
                      { key: 'fuel', label: 'Fuel' },
                    ]"
                  >
                    <template #cell(lap)="data">
                      {{ data.index + 1 }} {{ data.value }}
                    </template>
                    <template #cell(fuel)="data">
                      <div
                        v-text="data.value + '%'"
                        style="font-weight: bold"
                      ></div>
                    </template>
                  </b-table>
                </div>
              </div>
            </template>
          </b-table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
table,
td {
  text-align: center;
  vertical-align: middle;
}

::v-deep table,
::v-deep td {
  font-weight: bold; /* Make the text bolder */
}

.row {
  padding-bottom: 0.1%;
}

.btn-secondary {
  background-color: #35393d;
  border-color: #35393d;
}

.error-message {
  color: red;
  font-weight: bold;
}
</style>
