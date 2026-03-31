import React, { useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Play } from "lucide-react";
import apiClient from "@/lib/axios";

// Rice varieties available
const RICE_VARIETIES = [
  {
    value: "kdml105",
    label: "KDML105 (ข้าวหอมมะลิ)",
    file: "genomes/KDML/KDML105.fasta",
  },
] as const;

const KDML105_ANNOTATED_CONTIGS = new Set([
  "ptg000001l",
  "ptg000002l",
  "ptg000003l",
  "ptg000004l",
  "ptg000005l",
  "ptg000006l",
  "ptg000007l",
  "ptg000008l",
  "ptg000009l",
  "ptg000010l",
  "ptg000011l",
  "ptg000012l",
  "ptg000013l",
  "ptg000014l",
  "ptg000015l",
  "ptg000017l",
  "ptg000025l",
  "ptg000035l",
  "ptg000039l",
  "ptg000045l",
  "ptg000057l",
  "ptg000104l",
  "ptg000106l",
  "ptg000116l",
  "ptg000161l",
  "ptg000180l",
  "ptg000197l",
  "ptg000206l",
  "ptg000218l",
  "ptg000222l",
  "ptg000241l",
]);

const KDML105_CONTIGS = Array.from({ length: 246 }, (_, idx) =>
  `ptg${String(idx + 1).padStart(6, "0")}l`,
);
const KDML105_OTHER_CONTIGS = KDML105_CONTIGS.filter(
  (contig) => !KDML105_ANNOTATED_CONTIGS.has(contig),
);

const formSchema = z
  .object({
    variety: z.string().min(1, "กรุณาเลือกชนิดข้าว"),
    contig: z.string().min(1, "กรุณาเลือก Contig"),
    startPos: z
      .string()
      .min(1, "กรุณาระบุตำแหน่งเริ่มต้น")
      .regex(/^\d+$/, "ต้องเป็นตัวเลข"),
    endPos: z
      .string()
      .min(1, "กรุณาระบุตำแหน่งสิ้นสุด")
      .regex(/^\d+$/, "ต้องเป็นตัวเลข"),
    mismatches: z.string(),
    pam: z.string().min(1),
    spacerLength: z
      .string()
      .regex(/^\d+$/, "ต้องเป็นตัวเลข")
      .refine((v) => parseInt(v) >= 17 && parseInt(v) <= 24, {
        message: "Spacer Length ต้องอยู่ระหว่าง 17–24 bp",
      })
      .default("20"),
    email: z
      .string()
      .email("รูปแบบ email ไม่ถูกต้อง")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      const start = parseInt(data.startPos);
      const end = parseInt(data.endPos);
      return end > start;
    },
    {
      message: "ตำแหน่งสิ้นสุดต้องมากกว่าตำแหน่งเริ่มต้น",
      path: ["endPos"],
    },
  )
  .refine(
    (data) => {
      const start = parseInt(data.startPos);
      const end = parseInt(data.endPos);
      return end - start <= 100000;
    },
    {
      message: "ช่วง Region ต้องไม่เกิน 100,000 bp",
      path: ["endPos"],
    },
  );

type FormValues = z.infer<typeof formSchema>;

interface AnalysisFormProps {
  onSubmit: (jobId: string) => void;
}

export const AnalysisForm: React.FC<AnalysisFormProps> = ({ onSubmit }) => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      variety: "kdml105",
      contig: "ptg000001l",
      startPos: "",
      endPos: "",
      mismatches: "3",
      pam: "NGG",
      spacerLength: "20",
      email: "",
    },
  });

  const regionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spacerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRegionChange = useCallback(
    (field: "startPos" | "endPos", value: string) => {
      form.setValue(field, value);
      if (regionTimerRef.current) clearTimeout(regionTimerRef.current);
      regionTimerRef.current = setTimeout(() => {
        const start = parseInt(form.getValues("startPos"));
        const end = parseInt(form.getValues("endPos"));
        if (!isNaN(start) && !isNaN(end)) {
          if (end <= start) {
            form.setValue("endPos", String(start + 1));
          } else if (end - start > 100000) {
            form.setValue("endPos", String(start + 100000));
          }
        }
      }, 600);
    },
    [form],
  );

  const handleSpacerLengthChange = useCallback(
    (value: string) => {
      form.setValue("spacerLength", value);
      if (spacerTimerRef.current) clearTimeout(spacerTimerRef.current);
      spacerTimerRef.current = setTimeout(() => {
        const num = parseInt(value);
        if (!isNaN(num)) {
          if (num < 17) form.setValue("spacerLength", "17");
          else if (num > 24) form.setValue("spacerLength", "24");
        }
      }, 600);
    },
    [form],
  );

  const handleSubmit = async (values: FormValues) => {
    try {
      const response = await apiClient.post("/analysis/submit", {
        variety: values.variety,
        startPos: parseInt(values.startPos),
        endPos: parseInt(values.endPos),
        options: {
          contig: values.contig,
          mismatches: parseInt(values.mismatches),
          pam: values.pam,
          spacerLength: parseInt(values.spacerLength),
          email: values.email || undefined,
        },
      });

      if (response.data.jobId) {
        onSubmit(response.data.jobId);
      }
    } catch (error) {
      console.error("Failed to submit job:", error);
      form.setError("root", {
        message: "ไม่สามารถส่ง job ได้ กรุณาลองใหม่อีกครั้ง",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Rice Variety Selection */}
        <FormField
          control={form.control}
          name="variety"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ชนิดข้าว (Rice Variety)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกชนิดข้าว" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {RICE_VARIETIES.map((variety) => (
                    <SelectItem key={variety.value} value={variety.value}>
                      {variety.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                เลือก genome ที่ต้องการวิเคราะห์
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Region Selection - Required */}
        <FormField
          control={form.control}
          name="contig"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contig / Scaffold</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือก contig" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Annotated (GFF3 available)</SelectLabel>
                    {KDML105_CONTIGS.filter((contig) =>
                      KDML105_ANNOTATED_CONTIGS.has(contig),
                    ).map((contig) => (
                      <SelectItem key={contig} value={contig}>
                        {contig}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Other scaffolds</SelectLabel>
                    {KDML105_OTHER_CONTIGS.map((contig) => (
                      <SelectItem key={contig} value={contig}>
                        {contig}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FormDescription>
                เลือก contig ที่ต้องการวิเคราะห์ (ถ้าไม่มี annotation ใน GFF3
                ตำแหน่งอาจแสดงเป็น Intergenic)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4 border rounded-md p-4 bg-muted/20">
          <h4 className="text-sm font-semibold">
            Genomic Region <span className="text-red-500">*</span>
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startPos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Position (bp)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="เช่น 10000"
                      {...field}
                      onChange={(e) =>
                        handleRegionChange("startPos", e.target.value)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endPos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Position (bp)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="เช่น 50000"
                      {...field}
                      onChange={(e) =>
                        handleRegionChange("endPos", e.target.value)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormDescription className="text-xs">
            ระบุ region ที่ต้องการค้นหา CRISPR spacers (ตำแหน่ง bp ใน genome) — ขนาด region สูงสุด 100,000 bp
          </FormDescription>
        </div>

        {/* PAM & Spacer Settings */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="pam"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PAM Sequence</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select PAM" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="NGG">SpCas9</SelectItem>
                    <SelectItem disabled={true} value="TTTV-CAS12">
                      Cas12
                    </SelectItem>
                    <SelectItem disabled={true} value="TTTV-CAS12A">
                      Cas12a
                    </SelectItem>
                    <SelectItem disabled={true} value="TTTV-CAS13">
                      Cas13
                    </SelectItem>
                    <SelectItem disabled={true} value="TTTV-CAS13A">
                      Cas13a
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="spacerLength"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Spacer Length (bp)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={17}
                    max={24}
                    {...field}
                    onChange={(e) => handleSpacerLengthChange(e.target.value)}
                  />
                </FormControl>
                <FormDescription>ช่วง: 17–24 bp</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Mismatches */}
        <FormField
          control={form.control}
          name="mismatches"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maximum Mismatches</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mismatch tolerance" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="0">0 (Strict)</SelectItem>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3 (Standard)</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                ค่าน้อยกว่ารันเร็วกว่า ค่ามาตรฐานคือ 3
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email Notification */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Notification (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="your@email.com" {...field} />
              </FormControl>
              <FormDescription>
                ระบบจะแจ้งเตือนเมื่อการวิเคราะห์เสร็จสิ้น
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Error message */}
        {form.formState.errors.root && (
          <div className="text-sm text-red-500 text-center">
            {form.formState.errors.root.message}
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full"
        >
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              กำลังส่ง...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Start Analysis
            </>
          )}
        </Button>
      </form>
    </Form>
  );
};
