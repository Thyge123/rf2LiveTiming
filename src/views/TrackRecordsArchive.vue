<script>
export default {
  data() {
    return {
      isLoading: true,
      tracks: [],
      trackVenue: "",
      fields: [
        { key: "driverName", label: "Name" },
        { key: "bestLapTime", label: "Lap Time" },
      ],
      standings: [],
    };
  },
  computed: {},

  methods: {
    async getTracks() {
      await this.axios
        .get(`https://localhost:7190/api/Track/laps/${this.trackVenue}`)
        .then((response) => {
          this.standings = response.data;
          console.log(response.data);
        });
    },
  },
  created() {
    this.trackVenue = this.$route.params.trackVenue;
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
      <div class="card text-white bg-dark">
        <div class="card-body">
          <b-table
            striped
            hover
            dark
            borderless
            :items="standings"
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
          </b-table>
        </div>
      </div>
    </div>
  </div>
</template>
