<script>
export default {
  name: "ResultsParserTable",
  props: {
    standings: Array,
    selectedFile: Object,
    selectedCarClass: String,
    searchQuery: String,
    getCarClassColor: Function,
  },
  data() {
    return {
      isLoading: true,
      fields: [
        { key: "details", label: "" },
        { key: "position", label: "POS" },
        { key: "carClass", label: "Class" },
        { key: "driverName", label: "Name" },
        { key: "fullTeamName", label: "Team" },
        { key: "BestLapTime", label: "Best" },
        { key: "lapsCompleted", label: "Laps" },
      ],
      fields2: [
        "lap",
        { key: "s1", label: "S1" },
        { key: "s2", label: "S2" },
        { key: "s3", label: "S3" },
        { key: "lapTime", label: "Lap Time" },
        { key: "fuel", label: "Fuel" },
      ],
    };
  },
  computed: {
    filteredStandings() {
      return this.standings.filter((standing) => {
        return (
          (this.selectedCarClass === "Class: All" ||
            standing.carClass === this.selectedCarClass) &&
          standing?.driverName
            ?.toLowerCase()
            ?.includes(this.searchQuery.toLowerCase())
        );
      });
    },
  },
};
</script>
<template>
  <b-table
    striped
    hover
    dark
    borderless
    :items="filteredStandings"
    :fields="fields"
  >
    <template #cell(details)="row">
      <b-button @click="row.toggleDetails">
        {{ row.detailsShowing ? "-" : "+" }}
      </b-button>
    </template>
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
    <template v-slot:row-details="row">
      <div class="card text-white bg-dark" style="text-align: center">
        <div class="card-body">
          <b-table
            striped
            dark
            borderless
            :items="row.item.lapDetails"
            :fields="fields2"
          >
            <template #cell(lap)="data">
              {{ data.index + 1 }} {{ data.value }}
            </template>
            <template #cell(fuel)="data">
              <div v-text="data.value + '%'" style="font-weight: bold"></div>
            </template>
          </b-table>
        </div>
      </div>
    </template>
  </b-table>
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
