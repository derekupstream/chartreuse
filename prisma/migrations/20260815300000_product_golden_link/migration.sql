-- Every data product links a golden dataset: test, validation, demo and regression case.
ALTER TABLE "DataProductDefinition" ADD COLUMN "goldenDatasetId" UUID;
