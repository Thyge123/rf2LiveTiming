<script>
export default {
  name: "ResultsParser",
  props: ["track"],
  data() {
    return {
      files: [],
      selectedFile: null,
      fields: [
        { key: "details", label: "" },
        "position",
        { key: "driverName", label: "Name" },
        { key: "carClass", label: "Class" },
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
      standings: [],
      trackName: null,
      session: null,
      timeString: null,
      errorMessage: null,
      isLoading: true,
    };
  },
  computed: {
    standingsWithLapDetails() {
      return this.standings.map((standing) => ({
        ...standing,
        lapDetails: standing.lapDetails.map((lapDetail, index) => ({
          lapNumber: index + 1,
          ...lapDetail,
        })),
      }));
    },
    filteredFiles() {
      return this.files.filter((file) => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(file.content, "text/xml");

        const trackCourseElement = xmlDoc.getElementsByTagName("TrackCourse");
        const trackCourse =
          trackCourseElement.length > 0
            ? trackCourseElement[0].textContent
            : null;

        const bestLapTimeElements = Array.from(
          xmlDoc.getElementsByTagName("BestLapTime")
        );
        const hasBestLap = bestLapTimeElements.some(
          (element) => element.textContent.trim() !== ""
        );

        return trackCourse === this.track && hasBestLap;
      });
    },
  },
  watch: {
    standings(newStandings) {
      this.$emit("standings-updated", newStandings);
    },
    session(newSession) {
      this.$emit("session-updated", newSession);
    },
    trackName(newTrackName) {
      this.$emit("track-name-updated", newTrackName);
    },
    timeString(newTimeString) {
      this.$emit("time-string-updated", newTimeString);
    },
    selectedFile(newFile) {
      if (newFile) {
        this.isLoading = true;
        // Parse the selected file
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(newFile.content, "text/xml");
        const timeStringElement = xmlDoc.getElementsByTagName("TimeString");
        const trackCourseElement = xmlDoc.getElementsByTagName("TrackCourse");
        const sessionElement = getFirstExistingTag(
          xmlDoc,
          "Practice1",
          "Qualify",
          "Race"
        );
        this.timeString =
          timeStringElement.length > 0
            ? timeStringElement[0].textContent
            : null;
        this.trackName =
          trackCourseElement.length > 0
            ? trackCourseElement[0].textContent
            : null;
        this.session = sessionElement ? sessionElement.nodeName : null;

        // Extract the data and format it to match the structure of the standings array
        const elements = Array.from(xmlDoc.getElementsByTagName("Driver"));
        this.standings = elements.map((element) => {
          const positionElement = element.getElementsByTagName("Position");
          const driverNameElement = element.getElementsByTagName("Name");
          const carClassElement = element.getElementsByTagName("CarClass");
          const fullTeamNameElement = element.getElementsByTagName("TeamName");
          const bestLapTimeElement =
            element.getElementsByTagName("BestLapTime");
          const FinishTimeElement = element.getElementsByTagName("FinishTime");
          const lapsElement = element.getElementsByTagName("Laps");
          const lapElements = Array.from(element.getElementsByTagName("Lap"));
          const lapDetails = lapElements
            .map((lapElement) => {
              const s1Attribute = lapElement.getAttribute("s1");
              const s2Attribute = lapElement.getAttribute("s2");
              const s3Attribute = lapElement.getAttribute("s3");
              const fuelAttribute = lapElement.getAttribute("fuel");
              const lapTimeText = lapElement.textContent;
              const lapTime =
                lapTimeText && !isNaN(lapTimeText)
                  ? parseFloat(lapTimeText)
                  : null;
              return {
                s1: s1Attribute ? parseFloat(s1Attribute).toFixed(3) : null,
                s2: s2Attribute ? parseFloat(s2Attribute).toFixed(3) : null,
                s3: s3Attribute ? parseFloat(s3Attribute).toFixed(3) : null,
                fuel: fuelAttribute
                  ? parseFloat(fuelAttribute * 100).toFixed(0)
                  : null,
                lapTime: lapTime ? sec2time(lapTime) : null,
              };
            })
            .filter((lapDetail) => lapDetail.lapTime !== null);

          return {
            position:
              positionElement.length > 0
                ? positionElement[0].textContent
                : null,
            driverName:
              driverNameElement.length > 0
                ? driverNameElement[0].textContent
                : null,
            carClass:
              carClassElement.length > 0
                ? carClassElement[0].textContent
                : null,
            fullTeamName:
              fullTeamNameElement.length > 0
                ? fullTeamNameElement[0].textContent
                : null,
            BestLapTime:
              bestLapTimeElement.length > 0
                ? sec2time(bestLapTimeElement[0].textContent)
                : null,
            lapsCompleted:
              lapsElement.length > 0 ? lapsElement[0].textContent : null,
            lapDetails: lapDetails,
            FinishTime:
              FinishTimeElement.length > 0
                ? sec2time(FinishTimeElement[0].textContent)
                : null,
          };
        });
      }
      this.$emit("file-selected", newFile);
      this.isLoading = false;
    },
  },
  methods: {
    async fetchFiles() {
      try {
        await this.axios
          .get("https://localhost:7190/api/rF2XML/GetAllXMLResults")
          .then((response) => {
            this.files = response.data;
          });
      } catch (error) {
        this.hasConnection = false;
        this.errorMessage =
          "An error occurred while getting XML info. Please refresh the page.   " +
          error.message;
      }
    },
    rowClicked(item, index) {
      this.$set(
        this.standings[index],
        "_showDetails",
        !this.standings[index]._showDetails
      );
    },
  },
  created() {
    this.fetchFiles();
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
function getFirstExistingTag(xmlDoc, ...tags) {
  for (let tag of tags) {
    let elements = xmlDoc.getElementsByTagName(tag);
    if (elements.length > 0) {
      return elements[0];
    }
  }
  return null;
}
</script>

<template>
  <b-form-select
    v-model="selectedFile"
    style="height: 100%; text-align-last: start"
  >
    <option :value="null">None</option>
    <b-form-select-option
      v-for="file in filteredFiles"
      :key="file.id"
      :value="file"
    >
      {{ file.name }}
    </b-form-select-option>
  </b-form-select>
</template>
<style scoped>
.text-center {
  text-align: center;
}

.dropdown-label {
  text-align: left;
  margin-right: 10px; /* Adjust as needed */
}
</style>
