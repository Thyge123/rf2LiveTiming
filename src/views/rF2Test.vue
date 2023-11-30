<script>
export default {
  data() {
    return {
      standings: [],
      carIds: [],
      trackName: "",
      session: "",
      trackTemp: 0,
      airTemp: 0,
      minWetness: 0,
      maxWetNess: 0,
      avgWetNess: 0,
      yellowflags: [],
      s1: false,
      s2: false,
      s3: false,
      currentEventTime: 0,
      endEventTime: 0,
      remaningTime: 0,
    };
  },
  computed: {},
  methods: {
    async getList() {
      await this.axios
        .get("http://localhost:5397/rest/watch/standings")
        .then((response) => {
          this.standings = response.data;
          this.standings.sort((a, b) => a.position - b.position);
          console.log(this.standings);
          this.standings.forEach((element) => {
            element.lastLapTime = parseFloat(element.lastLapTime).toFixed(3);
            element.bestLapTime = parseFloat(element.bestLapTime).toFixed(3);
            element.lastLapTime = sec2time(element.lastLapTime);
            element.bestLapTime = sec2time(element.bestLapTime);
            this.carIds.push(element.carId);
            if (
              element.lastLapTime.startsWith("-") ||
              element.lastLapTime.startsWith("00")
            ) {
              element.lastLapTime = "-";
            }
            if (element.bestLapTime.startsWith("-")) {
              element.bestLapTime = "-";
            }
          });
        });
      //this.getCarImage()
    },
    async getSessionInfo() {
      await this.axios
        .get("http://localhost:5397/rest/watch/sessionInfo")
        .then((response) => {
          this.trackName = response.data.trackName;
          this.session = response.data.session;
          this.trackTemp = parseFloat(response.data.trackTemp).toFixed(1);
          this.airTemp = parseFloat(response.data.ambientTemp).toFixed(1);
          this.maxWetness = response.data.maxPathWetness;
          this.avgWetness = response.data.averagePathWetness;
          this.currentEventTime = response.data.currentEventTime;
          this.endEventTime = response.data.endEventTime;
          this.remaningTime = this.endEventTime - this.currentEventTime;
          this.remaningTime = secondsToHms(this.remaningTime);
          this.yellowflags.push(response.data.sectorFlag);
          if (this.yellowflags[0]?.includes("YELLOW")) {
            this.s1 = true;
          }
          if (this.yellowflags[1]?.includes("YELLOW")) {
            this.s2 = true;
          }
          if (this.yellowflags[2]?.includes("YELLOW")) {
            this.s3 = true;
          }
        });
    },

    /*
    async getCarImage() {
      this.carIds.forEach(async (element) => {
        await this.axios
          .get(`http://localhost:5397/rest/race/car/${element}/image?type=IMAGE_SMALL`)
          .then((response) => {
            element.carImage = response.data
            //this.standings.carImage = response.data
            console.log(this.carIds)
          })
      })
    }   */
  },
  created() {
    this.getList();
    this.getSessionInfo();
  },
  /*
  mounted: function () {
    window.setInterval(() => {
      this.getList();
      this.getSessionInfo();
    }, 1000);
  },
  */
};
function secondsToHms(d) {
  d = Number(d);
  var h = Math.floor(d / 3600);
  var m = Math.floor((d % 3600) / 60);
  var s = Math.floor((d % 3600) % 60);

  var hDisplay = h > 0 ? h + (h == 1 ? "" : ":") : "";
  var mDisplay = m > 0 ? m + (m == 1 ? "  " : ":") : "";
  var sDisplay = s > 0 ? s + (s == 1 ? " " : " ") : "";
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
  <div class="container">
    <div class="item">
      <div class="trackInfo">
        <div>Track: {{ trackName }}</div>
        <div>Time Left: {{ remaningTime }}</div>
        <div>Session: {{ session }}</div>
        <div>AmbientTemp: {{ airTemp }}</div>
        <div>TrackTemp: {{ trackTemp }}</div>
      </div>
    </div>
    <div class="item">
      <div class="sectors">
        <div class="square" v-if="s1" style="background-color: yellow">S1</div>
        <div class="square" v-else style="background-color: green">S1</div>
        <div class="square" v-if="s2" style="background-color: yellow">S2</div>
        <div class="square" v-else style="background-color: green">S2</div>
        <div class="square" v-if="s3" style="background-color: yellow">S3</div>
        <div class="square" v-else style="background-color: green">S3</div>
      </div>
    </div>
    <div class="item">
      <table>
        <th>Position</th>
        <th>Car Class</th>
        <th>Name</th>
        <th>Team</th>
        <th>Last</th>
        <th>Best</th>
        <th>PitStops</th>
        <th>Laps</th>
        <tr v-for="driver in standings" :key="driver.id">
          <td>{{ driver.position }}</td>
          <td
            v-if="driver.carClass.includes('National')"
            style="
              background-color: #006bd5;
              text-align-last: center;
              padding: 10px 0px !important;
              width: 120px !important;
              display: inline-block;
            "
          >
            {{ driver.carClass }}
          </td>
          <td
            v-else
            if="driver.carClass.includes('Championship')"
            style="
              background-color: #e02d2d;
              text-align-last: center;
              padding: 10px 0px !important;
              width: 120px !important;
              display: inline-block;
            "
          >
            {{ driver.carClass }}
          </td>
          <td>{{ driver.driverName }}</td>
          <td>{{ driver.fullTeamName }}</td>
          <td>{{ driver.lastLapTime }}</td>
          <td>{{ driver.bestLapTime }}</td>
          <td>{{ driver.pitstops }}</td>
          <td>{{ driver.lapsCompleted }}</td>
        </tr>
      </table>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  width: 100%;
  flex-direction: row;
  font-size: 16px;
  color: white;
}

.item {
  display: flex;
  width: 100%;
  flex-direction: row;
}

td {
  padding: 0 100px;
  text-align: center;
}

.sectors {
  display: flex;
  height: 55px;
  justify-content: center;
  gap: 10px;
}

.square {
  height: 50px;
  width: 65px;
  color: rgb(0, 0, 0);
  text-align: center;
  background: rgb(18, 197, 0);
  border-radius: 5px 5px 5px 5px;
}
</style>
