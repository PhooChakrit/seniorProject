import React, { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TargetInput,
  SpeciesSelector,
  // NucleaseSelector,
  PurposeSelector,
  AdvancedOptions,
  FindTargetButton,
} from "@/components/crispr";

// type NucleaseType = "cas9" | "cas12a";
type PurposeType = "knock-out" | "knock-in" | "prime-edit";

export const DataPage: React.FC = () => {
  const [target, setTarget] = useState("");
  const [species, setSpecies] = useState("Oryza sativa (IRGSP-1.0)");
  // const [nuclease, setNuclease] = useState<NucleaseType>('cas9');
  const [purpose, setPurpose] = useState<PurposeType>("knock-out");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);

  // Advanced options
  const [pamOverride, setPamOverride] = useState("NGG");
  const [guideLength, setGuideLength] = useState("20");
  const [maxMismatch, setMaxMismatch] = useState("3");
  const [offTargetSensitivity, setOffTargetSensitivity] = useState("medium");

  const handleFindTargets = async () => {
    if (!target.trim()) return;
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      // TODO: Implement actual CRISPR target finding logic
    }, 1500);
  };

  const handlePasteSequence = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setTarget(text);
    } catch (err) {
      console.error("Failed to read clipboard:", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setTarget(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8 py-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            CRISPR-Cas9 Guide RNA Design
          </h1>
          <p className="text-lg text-muted-foreground">
            Design highly specific guide RNAs for your CRISPR-Cas9 experiments
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1 pb-8">
            <CardTitle className="text-2xl">Target Selection</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter your target gene or sequence to find optimal CRISPR-Cas9
              sites
            </p>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* 2. Species Selector */}
            <SpeciesSelector species={species} onSpeciesChange={setSpecies} />

            {/* 1. Target Input Section */}
            <TargetInput
              target={target}
              onTargetChange={setTarget}
              onPasteSequence={handlePasteSequence}
              onFileChange={handleFileChange}
            />

            {/* 4. Purpose Selector */}
            <PurposeSelector purpose={purpose} onPurposeChange={setPurpose} />

            {/* 3. Nuclease Selector */}
            {/* <NucleaseSelector
              nuclease={nuclease}
              onNucleaseChange={setNuclease}
            /> */}

            {/* 5. Advanced Options */}
            <AdvancedOptions
              showAdvanced={showAdvanced}
              onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
              pamOverride={pamOverride}
              onPamOverrideChange={setPamOverride}
              guideLength={guideLength}
              onGuideLengthChange={setGuideLength}
              maxMismatch={maxMismatch}
              onMaxMismatchChange={setMaxMismatch}
              offTargetSensitivity={offTargetSensitivity}
              onOffTargetSensitivityChange={setOffTargetSensitivity}
            />

            {/* 6. Primary Action Button */}
            <FindTargetButton
              loading={loading}
              disabled={!target.trim()}
              onClick={handleFindTargets}
            />
          </CardContent>
        </Card>

        {/* Results Section - Placeholder */}
        {loading && (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">
                  Analyzing sequences and finding optimal CRISPR sites...
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};
