<script>
import { parseResults } from "rf2-results-parser";
import fs from "fs";
export default {
  data() {
    return {
      isLoading: true,
      tracks: [],
      routeValue: "",
      errorMessage: null,
      raceResults: [],
      test: null,
    };
  },
  computed: {},
  methods: {
    async getTracks() {
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
    RouteTrack(test) {
      console.log(test);
      let routeValue = test;
      this.$router.push({
        name: "TrackRecordsArchive",
        params: { trackVenue: routeValue },
      });
    },
    async ReadResultsFile() {
      try {
        await this.axios
          .get(
            "https://localhost:7190/api/rF2XML/GetAllXMLResults?directoryPath=D%3A%5C%5CRacing%5C%5Crfactor2-dedicated%5C%5CUserData%5C%5CLog%5C%5CResults"
          )
          .then((response) => {
            this.raceResults = response.data;
            fs.readFile(response.data[48].content, (err, data) => {
              const resultsData = parseResults(data);
              console.log(resultsData);
              this.test = resultsData;
              console.log(data);
            });
          });
      } catch (error) {
        this.errorMessage = error;
      }
      console.log(this.test);
    },
  },
  created() {
    this.getTracks();
    this.ReadResultsFile();
    this.isLoading = false;
  },
};
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
      <div class="col-12">
        <h1>Track Records Archive</h1>
      </div>
    </div>
    <div class="row" v-for="track in tracks" :key="track.id">
      <div class="col-12" style="padding-bottom: 0.5%">
        <div class="card text-white bg-dark">
          <div class="card-body">
            <div class="row">
              <div class="col-md-8">
                <h2>{{ track.trackCourse }}</h2>
              </div>
              <div class="col-md-4" style="text-align: end">
                <button
                  type="button"
                  class="btn btn-secondary"
                  @click="RouteTrack(track.trackCourse)"
                >
                  Records
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.error-message {
  color: red;
  font-weight: bold;
}
</style>
```
