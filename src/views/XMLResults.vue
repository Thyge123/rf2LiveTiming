<script>
import XMLFileResultsParser from "../components/XMLFileResultsParser.vue";
import XMLResultsTable from "../components/XMLResultsTable.vue";
export default {
  components: {
    XMLFileResultsParser,
    XMLResultsTable,
  },
  data() {
    return {
      isLoading: true,
      tracks: [],
      trackCourse: "",
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
      selectedFile: null,
      session: "",
      trackName: "",
      timeString: "",
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
    updateSelectedFile(newFile) {
      this.selectedFile = newFile;
    },
    updateStandings(newStandings) {
      this.standings = newStandings;
    },
    updateSession(newSession) {
      this.session = newSession;
    },
    updateTrackname(newTrackName) {
      this.trackName = newTrackName;
    },
    updateTimeString(newTimeString) {
      this.timeString = newTimeString;
    },
    handleTrackChange(value) {
      if (value === "null") {
        this.selectedFile = null;
      }
      console.log(this.selectedFile);
    },
    async getAllTracks() {
      try {
        await this.axios
          .get("https://localhost:7190/api/Track")
          .then((response) => {
            this.tracks = response.data;
          });
      } catch (error) {
        this.errorMessage = error;
      }
    },
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
  },
  created() {
    this.getAllTracks();
  },
};
</script>
<template>
  <div class="container-fluid">
    <div class="row">
      <div class="card text-white bg-dark">
        <div class="card-body">
          <div class="row d-flex">
            <div class="col-md-7">
              <b-form-select
                v-model="trackCourse"
                @change="handleTrackChange"
                style="height: 100%; min-height: 40px"
              >
                <option :value="null">Please select a track</option>
                <option
                  v-for="track in tracks"
                  :key="track.id"
                  :value="track.trackCourse"
                >
                  {{ track.trackCourse }}
                </option></b-form-select
              >
            </div>
            <div class="col-md-1" v-if="selectedFile">
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
            <div class="col-md-2" v-if="selectedFile">
              <b-form-input
                v-model="searchQuery"
                placeholder="Search for a driver"
              ></b-form-input>
            </div>

            <div
              class="col ml-auto"
              style="display: flex; justify-content: flex-end"
              v-if="trackCourse"
            >
              <XMLFileResultsParser
                :track="trackCourse"
                @file-selected="updateSelectedFile"
                @standings-updated="updateStandings"
                @session-updated="updateSession"
                @track-name-updated="updateTrackname"
                @time-string-updated="updateTimeString"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="row" v-if="selectedFile">
      <div class="card text-white bg-dark">
        <div class="card-body">
          <div class="trackName">
            <div class="row">
              <div class="col-md-8">
                <p>Track: {{ trackName }}</p>
              </div>
              <div class="col-md-4" style="text-align: end">
                <p>Date: {{ timeString }}</p>
              </div>
            </div>
            <div class="sessionName">Session: {{ session }}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="row" v-if="selectedFile">
      <div class="card text-white bg-dark">
        <div class="card-body">
          <div class="row">
            <XMLResultsTable
              :selected-file="selectedFile"
              :getCarClassColor="getCarClassColor"
              :standings="standings"
              :selectedCarClass="selectedCarClass"
              :searchQuery="searchQuery"
              :sessionType="session"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.trackName p,
.sessionName {
  font-size: 1.5rem;
  font-weight: bolder;
}
</style>
