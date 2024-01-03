import { shallowMount } from "@vue/test-utils";
import axios from "axios";
import TracksArchive from "@/views/TracksArchive.vue";

jest.mock("axios");

describe("TracksArchive.vue", () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallowMount(TracksArchive);
  });

  it("renders without crashing", () => {
    expect(wrapper.exists()).toBe(true);
  });

  it("fetches tracks on mount", async () => {
    const tracks = [{ name: "Track 1" }, { name: "Track 2" }];
    axios.get.mockResolvedValueOnce({ data: tracks });

    await wrapper.vm.getAllTracks();

    expect(wrapper.vm.tracks).toEqual(tracks);
  });

  it("handles error when fetching tracks", async () => {
    const error = new Error("Network error");
    axios.get.mockRejectedValueOnce(error);

    await wrapper.vm.getAllTracks();

    expect(wrapper.vm.errorMessage).toBe(error);
  });

  it("routes to TrackRecordsArchive with correct params", () => {
    const pushSpy = jest.fn();
    wrapper = shallowMount(TracksArchive, {
      mocks: {
        $router: {
          push: pushSpy,
        },
      },
    });

    const testTrack = "Test Track";
    wrapper.vm.RouteTrack(testTrack);

    expect(pushSpy).toHaveBeenCalledWith({
      name: "TrackRecordsArchive",
      params: { trackVenue: testTrack },
    });
  });

  // Add more tests for other methods and computed properties
});
