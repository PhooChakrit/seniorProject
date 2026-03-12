import React from "react";
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

const formSchema = z
  .object({
    variety: z.string().min(1, "กรุณาเลือกชนิดข้าว"),
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
    spacerLength: z.string().regex(/^\d+$/, "ต้องเป็นตัวเลข").default("20"),
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
      startPos: "",
      endPos: "",
      mismatches: "3",
      pam: "NGG",
      spacerLength: "20",
      email: "",
    },
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      const response = await apiClient.post("/analysis/submit", {
        variety: values.variety,
        startPos: parseInt(values.startPos),
        endPos: parseInt(values.endPos),
        options: {
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
                    <Input type="number" placeholder="เช่น 10000" {...field} />
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
                    <Input type="number" placeholder="เช่น 50000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormDescription className="text-xs">
            ระบุ region ที่ต้องการค้นหา CRISPR spacers (ตำแหน่ง bp ใน genome)
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
                    <SelectItem value="NGG">NGG (SpCas9)</SelectItem>
                    <SelectItem value="NAG">NAG</SelectItem>
                    <SelectItem value="TTTV">TTTV (Cas12a)</SelectItem>
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
                  <Input type="number" {...field} />
                </FormControl>
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
