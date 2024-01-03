<script>
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
    RouteTrack(track) {
      this.$router.push({
        name: "TrackRecordsArchive",
        params: { trackVenue: track },
      });
    },
  },
  created() {
    this.getAllTracks();
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
