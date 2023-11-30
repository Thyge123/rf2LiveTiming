<script>
export default {
  data() {
    return {
      isLoading: true,
      tracks: [],
      routeValue: "",
    };
  },
  computed: {},
  methods: {
    async getTracks() {
      await this.axios
        .get("https://localhost:7190/api/Track")
        .then((response) => {
          this.tracks = response.data;
          console.log(response.data);
        });
    },
    RouteTrack(test) {
      console.log(test);
      let routeValue = test;
      this.$router.push({
        name: "TrackRecordsArchive",
        params: { trackVenue: routeValue },
      });
    },
  },
  created() {
    this.getTracks();
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
      <div class="col-12">
        <div class="card text-white bg-dark">
          <div class="card-body">
            <div class="row">
              <div class="col-md-8">
                <h2>{{ track.trackVenue }}</h2>
              </div>
              <div class="col-md-4" style="text-align: end">
                <button
                  type="button"
                  class="btn btn-secondary"
                  @click="RouteTrack(track.trackVenue)"
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
