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
            this.tracks[0].image =
              "https://www.studio-397.com/wp-content/uploads/2020/11/Spa-Francorchamps_04.jpg";
            this.tracks[1].image =
              "https://www.studio-397.com/wp-content/uploads/2021/05/lrp_2021_screen_05.jpg";
            this.tracks[2].image =
              "https://www.studio-397.com/wp-content/uploads/2021/04/portland_2020_screen_09_720p.jpg";
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
        <h1 style="color: white">Track Records Archive</h1>
      </div>
    </div>
    <br />
    <div class="row" v-for="track in tracks" :key="track.id">
      <div class="col-6 mx-auto" style="padding-bottom: 0.5%">
        <div class="card text-white bg-dark"></div>
        <div
          class="card-body d-flex flex-column justify-content-center"
          :style="{
            backgroundImage: `url(${track.image})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            height: '150px',
          }"
        >
          <div class="row">
            <div class="col-md-8">
              <h2 class="cardMargin">{{ track.trackCourse }}</h2>
            </div>

            <div class="col-md-4" style="text-align: end">
              <button
                style="
                  margin: 1%;
                  background-color: rgba(0, 0, 0, 0.3);
                  border: 0;
                "
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
</template>

<style scoped>
.error-message {
  color: red;
  font-weight: bold;
}

.cardMargin {
  margin: 1%;
  color: white;
}
</style>
```
