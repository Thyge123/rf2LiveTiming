import { shallowMount } from "@vue/test-utils";
import TrackRecordsArchive from "@/views/TrackRecordsArchive.vue";

describe("TrackRecordsArchive.vue", () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallowMount(TrackRecordsArchive, {
      data() {
        return {
          standings: [
            { carClass: "LMH", Name: "Driver 1", lapTime: 120 },
            { carClass: "LMP2", Name: "Driver 2", lapTime: 130 },
            { carClass: "LMH", Name: "Driver 3", lapTime: 140 },
          ],
          selectedCarClass: "Class: All",
          searchQuery: "",
        };
      },
      mocks: {
        $route: {
          params: { TrackVenue: "Spa-Francorchamps Endurance" }, // Add the params you need to mock here
        },
      },
    });
  });

  it("computes uniqueCarClasses correctly", () => {
    expect(wrapper.vm.uniqueCarClasses).toEqual(["Class: All", "LMH", "LMP2"]);
  });

  it("filters standings by carClass correctly", () => {
    wrapper.setData({ selectedCarClass: "LMH" });
    expect(wrapper.vm.filteredStandings).toEqual([
      { carClass: "LMH", Name: "Driver 1", lapTime: 120 },
      { carClass: "LMH", Name: "Driver 3", lapTime: 140 },
    ]);
  });

  it("filters standings by searchQuery correctly", () => {
    wrapper.setData({ searchQuery: "Driver 1" });
    expect(wrapper.vm.filteredStandings).toEqual([
      { carClass: "LMH", Name: "Driver 1", lapTime: 120 },
    ]);
  });

  it("sorts standings by lapTime correctly", async () => {
    await wrapper.vm.getTracks();
    expect(wrapper.vm.standings).toEqual([
      { carClass: "LMH", Name: "Driver 1", lapTime: 120 },
      { carClass: "LMP2", Name: "Driver 2", lapTime: 130 },
      { carClass: "LMH", Name: "Driver 3", lapTime: 140 },
    ]);
  });
});
