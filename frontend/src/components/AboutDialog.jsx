import { Modal, Button, Typography, Divider } from "antd";
import logo from "../assets/logo.png";
import supportImg from "../assets/images/support.png";
import { useTranslation } from "react-i18next";
const { Text } = Typography;
export default function AboutDialog({ open, onClose }) {
  const { t } = useTranslation();
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={
        <Button type="primary" onClick={onClose}>
          {t("about.close")}
        </Button>
      }
      width={360}
      centered
    >
      <div style={{ textAlign: "center", padding: "16px 0" }}>
        <img
          src={logo}
          alt="Kardoo"
          style={{
            width: 80,
            height: 80,
            borderRadius: 16,
            marginBottom: 12,
            objectFit: "contain",
          }}
        />
        <Typography.Title level={4} style={{ margin: 0 }}>
          Kardoo
        </Typography.Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Version 1.0.0
        </Text>
        <Divider />
        <Text style={{ fontSize: 13 }}>
          {t("about.description")}
          <br />
          {t("about.subtitle")}
        </Text>
        <Divider />
        <img
          src={supportImg}
          alt="Support"
          title={t("about.support")}
          style={{
            width: 200,
            cursor: "pointer",
            opacity: 0.85,
            transition: "opacity 0.15s",
            marginBottom: 12,
            borderRadius: 12,
            mixBlendMode: "multiply",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.85)}
          onClick={() => window.open("https://ko-fi.com/B0B2KV8WP", "_blank")}
        />
        <br />
        <Text type="secondary" style={{ fontSize: 12 }}>
          {t("about.copyright")}
        </Text>
      </div>
    </Modal>
  );
}
