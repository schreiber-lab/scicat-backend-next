/* eslint-disable @typescript-eslint/no-var-requires */
"use strict";

var utils = require("./LoginUtils");
const { TestData } = require("./TestData");

var accessTokenIngestor = null;
var accessTokenArchiveManager = null;

var pidRaw1 = null;
var pidRaw2 = null;
var policyIds = null;
const raw2 = { ...TestData.RawCorrect };

describe("DatasetLifecycle: Test facet and filter queries", () => {
  beforeEach((done) => {
    utils.getToken(
      appUrl,
      {
        username: "ingestor",
        password: "aman",
      },
      (tokenVal) => {
        accessTokenIngestor = tokenVal;
        utils.getToken(
          appUrl,
          {
            username: "archiveManager",
            password: "aman",
          },
          (tokenVal) => {
            accessTokenArchiveManager = tokenVal;
            done();
          },
        );
      },
    );
  });

  it("adds a new raw dataset", async () => {
    return request(appUrl)
      .post("/api/v3/Datasets")
      .send(TestData.RawCorrect)
      .set("Accept", "application/json")
      .set({ Authorization: `Bearer ${accessTokenIngestor}` })
      .expect(200)
      .expect("Content-Type", /json/)
      .then((res) => {
        res.body.should.have.property("owner").and.be.string;
        res.body.should.have.property("type").and.equal("raw");
        res.body.should.have.property("pid").and.be.string;
        // store link to this dataset in datablocks
        // NOTE: Encoding the pid because it might contain some special characters.
        pidRaw1 = encodeURIComponent(res.body["pid"]);
      });
  });

  it("adds another new raw dataset", async () => {
    // modify owner
    raw2.ownerGroup = "p12345";
    return request(appUrl)
      .post("/api/v3/Datasets")
      .send(raw2)
      .set("Accept", "application/json")
      .set({ Authorization: `Bearer ${accessTokenIngestor}` })
      .expect(200)
      .expect("Content-Type", /json/)
      .then((res) => {
        res.body.should.have.property("owner").and.be.string;
        res.body.should.have.property("type").and.equal("raw");
        res.body.should.have.property("pid").and.be.string;
        // store link to this dataset in datablocks
        // NOTE: Encoding the pid because it might contain some special characters.
        pidRaw2 = encodeURIComponent(res.body["pid"]);
      });
  });

  it("Should return datasets with complex join query fulfilled", async () => {
    return request(appUrl)
      .get(
        "/api/v3/Datasets/fullquery?fields=" +
          encodeURIComponent(
            JSON.stringify(TestData.DatasetLifecycle_query_1.fields),
          ),
      )
      .set("Accept", "application/json")
      .set({ Authorization: `Bearer ${accessTokenIngestor}` })
      .expect(200)
      .expect("Content-Type", /json/)
      .then((res) => {
        res.body.should.be.an("array").that.is.not.empty;
        res.body[0]["datasetlifecycle"].should.have
          .property("archiveStatusMessage")
          .and.equal("datasetCreated");
      });
  });

  it("Should return no datasets, because number of hits exhausted", async () => {
    return request(appUrl)
      .get(
        "/api/v3/Datasets/fullquery?fields=" +
          encodeURIComponent(
            JSON.stringify(TestData.DatasetLifecycle_query_2.fields),
          ) +
          "&limits=" +
          encodeURIComponent(
            JSON.stringify(TestData.DatasetLifecycle_query_2.limits),
          ),
      )
      .set("Accept", "application/json")
      .set({ Authorization: `Bearer ${accessTokenIngestor}` })
      .expect(200)
      .expect("Content-Type", /json/)
      .then((res) => {
        res.body.should.be.an("array").that.is.empty;
      });
  });

  it("Should return facets with complex join query fulfilled", async () => {
    return request(appUrl)
      .get(
        "/api/v3/Datasets/fullfacet?fields=" +
          encodeURIComponent(
            JSON.stringify(TestData.DatasetLifecycle_query_3.fields),
          ) +
          "&facets=" +
          encodeURIComponent(
            JSON.stringify(TestData.DatasetLifecycle_query_3.facets),
          ),
      )
      .set("Accept", "application/json")
      .set({ Authorization: `Bearer ${accessTokenIngestor}` })
      .expect(200)
      .expect("Content-Type", /json/);
  });

  // Note: make the tests with PUT instead of patch as long as replaceOnPut false
  it("Should update archive status message from archiveManager account", async () => {
    return request(appUrl)
      .patch("/api/v3/Datasets/" + pidRaw1)
      .send({
        datasetlifecycle: {
          archiveStatusMessage: "dataArchivedOnTape",
        },
      })
      .set("Accept", "application/json")
      .set({ Authorization: `Bearer ${accessTokenIngestor}` })
      .expect(200)
      .expect("Content-Type", /json/)
      .then((res) => {
        res.body.should.have.nested
          .property("datasetlifecycle.archiveStatusMessage")
          .and.equal("dataArchivedOnTape");
      });
  });

  // PUT /datasets without specifying the id does not exist anymore
  it("Should update the datasetLifecycle information for multiple datasets", async () => {
    var filter = {
      pid: decodeURIComponent(pidRaw1),
    };
    return request(appUrl)
      .patch("/api/v3/Datasets/" + pidRaw1 + "?where=" + JSON.stringify(filter))
      .send({
        datasetlifecycle: {
          archiveStatusMessage: "justAnotherTestMessage",
        },
      })
      .set("Accept", "application/json")
      .set({ Authorization: `Bearer ${accessTokenIngestor}` })
      .expect(200)
      .expect("Content-Type", /json/)
      .then((res) => {
        res.body.should.have.nested
          .property(
            "history[0].datasetlifecycle.previousValue.archiveStatusMessage",
          )
          .and.equal("dataArchivedOnTape");
        res.body.should.have.nested
          .property(
            "history[0].datasetlifecycle.currentValue.archiveStatusMessage",
          )
          .and.equal("justAnotherTestMessage");
      });
  });

  it("The history status should now include the last change for the first raw dataset", async () => {
    return request(appUrl)
      .get("/api/v3/Datasets/" + pidRaw1)
      .set("Accept", "application/json")
      .set({ Authorization: `Bearer ${accessTokenIngestor}` })
      .expect(200)
      .expect("Content-Type", /json/)
      .then((res) => {
        res.body.should.have.nested
          .property(
            "history[0].datasetlifecycle.previousValue.archiveStatusMessage",
          )
          .and.equal("dataArchivedOnTape");
        res.body.should.have.nested
          .property(
            "history[0].datasetlifecycle.currentValue.archiveStatusMessage",
          )
          .and.equal("justAnotherTestMessage");
      });
  });

  // endpoint doesn't exist anymore
  // it("Should update the datasetLifecycle information directly via embedded model API", async () => {
  //   return request(appUrl)
  //     .put("/api/v3/Datasets/" + pidRaw1 + "/datasetLifecycle")
  //     .send({
  //       archiveStatusMessage: "Testing embedded case",
  //     })
  //     .set("Accept", "application/json")
  //     .set({ Authorization: `Bearer ${accessTokenIngestor}` })
  //     .expect(200)
  //     .expect("Content-Type", /json/)
  //     .then((res) => {
  //       res.body.should.have
  //         .property("archiveStatusMessage")
  //         .and.equal("Testing embedded case");
  //     });
  // });

  // endpoint doesn't exist anymore
  // it("Should reset the embedded DatasetLifecycle status and delete Datablocks", async () => {
  //   return request(appUrl)
  //     .put("/api/v3/Datasets/resetArchiveStatus")
  //     .send({
  //       datasetId: pidRaw1,
  //     })
  //     .set("Accept", "application/json")
  //     .set({ Authorization: `Bearer ${accessTokenIngestor}` })
  //     .expect(200)
  //     .expect("Content-Type", /json/);
  // });

  it("check for the 2 default policies to have been created", async () => {
    // Query only newly created ones by the tests. This way we prevent removing all the policies that exist before the tests were run.
    const start = new Date();
    start.setHours(start.getHours(), 0, 0, 0);
    const filter = {
      where: {
        createdAt: { $gte: start },
        ownerGroup: { $in: [TestData.RawCorrect.ownerGroup, raw2.ownerGroup] },
      },
    };

    return request(appUrl)
      .get(
        `/api/v3/Policies?filter=${encodeURIComponent(JSON.stringify(filter))}`,
      )
      .set("Accept", "application/json")
      .set({ Authorization: `Bearer ${accessTokenIngestor}` })
      .expect(200)
      .expect("Content-Type", /json/)
      .then((res) => {
        res.body.should.be.an("array").to.have.lengthOf(2);
        policyIds = res.body.map((x) => x["_id"]);
      });
  });

  it("should delete the two policies", async () => {
    for (const item of policyIds) {
      await request(appUrl)
        .delete("/api/v3/policies/" + item)
        .set("Accept", "application/json")
        .set({ Authorization: `Bearer ${accessTokenIngestor}` })
        .expect(200);
    }
  });

  it("should delete the newly created dataset", async () => {
    return request(appUrl)
      .delete("/api/v3/Datasets/" + pidRaw1)
      .set("Accept", "application/json")
      .set({ Authorization: `Bearer ${accessTokenArchiveManager}` })
      .expect(200);
  });

  it("should delete the newly created dataset", async () => {
    return request(appUrl)
      .delete("/api/v3/Datasets/" + pidRaw2)
      .set("Accept", "application/json")
      .set({ Authorization: `Bearer ${accessTokenArchiveManager}` })
      .expect(200);
  });
});
