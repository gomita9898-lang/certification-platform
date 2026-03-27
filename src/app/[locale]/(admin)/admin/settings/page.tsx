"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Breadcrumb } from "@/components/admin/breadcrumb";

interface SettingsForm {
  default_pass_threshold: string;
  platform_name_pt: string;
  platform_name_en: string;
  certificate_issuer_name: string;
  certificate_institution_name: string;
}

const SETTINGS_KEYS: (keyof SettingsForm)[] = [
  "default_pass_threshold",
  "platform_name_pt",
  "platform_name_en",
  "certificate_issuer_name",
  "certificate_institution_name",
];

export default function AdminSettingsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const [form, setForm] = useState<SettingsForm>({
    default_pass_threshold: "70",
    platform_name_pt: "Plataforma de Certificacao",
    platform_name_en: "Certification Platform",
    certificate_issuer_name: "",
    certificate_institution_name: "",
  });

  const supabase = createClient();

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", SETTINGS_KEYS);

    if (data) {
      const newForm = { ...form };
      data.forEach((row) => {
        if (row.key in newForm) {
          newForm[row.key as keyof SettingsForm] = row.value;
        }
      });
      setForm(newForm);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Upsert each setting
      for (const key of SETTINGS_KEYS) {
        const { error } = await supabase
          .from("app_settings")
          .upsert(
            { key, value: form[key], updated_at: new Date().toISOString() },
            { onConflict: "key" }
          );
        if (error) throw error;
      }
      showToast(t("savedSuccessfully"), "success");
    } catch {
      showToast(tCommon("error"), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">{tCommon("loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ label: t("settings") }]} />

      <div>
        <h1 className="font-merriweather text-3xl font-bold tracking-tight">
          {t("settings")}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("settings")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="default_pass_threshold">
              {t("passThreshold")}
            </Label>
            <Input
              id="default_pass_threshold"
              type="number"
              min={0}
              max={100}
              value={form.default_pass_threshold}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  default_pass_threshold: e.target.value,
                }))
              }
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="platform_name_pt">{t("titlePt")}</Label>
              <Input
                id="platform_name_pt"
                value={form.platform_name_pt}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    platform_name_pt: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform_name_en">{t("titleEn")}</Label>
              <Input
                id="platform_name_en"
                value={form.platform_name_en}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    platform_name_en: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="certificate_issuer_name">
              {locale === "en" ? "Certificate issuer name" : "Nome do emissor do certificado"}
            </Label>
            <Input
              id="certificate_issuer_name"
              value={form.certificate_issuer_name}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  certificate_issuer_name: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="certificate_institution_name">
              {locale === "en"
                ? "Certificate institution name"
                : "Nome da instituicao do certificado"}
            </Label>
            <Input
              id="certificate_institution_name"
              value={form.certificate_institution_name}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  certificate_institution_name: e.target.value,
                }))
              }
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? tCommon("loading") : tCommon("save")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
