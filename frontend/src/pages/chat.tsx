import React, { useEffect, useRef, useState } from "react";
import { ReactElement } from "react";
import Image from "next/image";
import MainLayout from "@/components/layout/MainLayout";
import ChatInput from "@/components/chat/ChatInput";
import Message from "@/components/chat/Message";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { clearMessages, addMessage } from "@/store/slices/chatSlice";
import { fetchConversationMessages } from "@/store/slices/conversationSlice";
import {
  Spin,
  Alert,
  Button,
  Input,
  Select,
  message as antdMessage,
} from "antd";
import { RightOutlined, LeftOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import { logout } from "@/store/slices/authSlice";

const Chat = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { messages, status } = useAppSelector((state) => state.chat);
  const { currentMessages, currentConversationId, error } = useAppSelector(
    (state) => state.conversations,
  );

  // Manage active template state locally for the UI
  const [activeTemplate, setActiveTemplate] = useState<any>(null);
  const [templateVariables, setTemplateVariables] = useState<
    Record<string, string>
  >({});
  const [isConfigVisible, setIsConfigVisible] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevQueryId = useRef<string | null>(null);

  // 1. Monitor URL changes to load conversations
  useEffect(() => {
    if (!router.isReady) return;
    const queryId = router.query.id as string;
    const normalizedQueryId = queryId ? parseInt(queryId) : null;
    if (queryId !== prevQueryId.current) {
      const wasNewChat =
        prevQueryId.current === null || prevQueryId.current === undefined;
      const isSwitchingToDifferentChat =
        !!normalizedQueryId && normalizedQueryId !== currentConversationId;

      if (isSwitchingToDifferentChat || (!wasNewChat && !normalizedQueryId)) {
        dispatch(clearMessages());
      }
      prevQueryId.current = queryId;
      if (queryId && status === "idle") {
        dispatch(fetchConversationMessages(parseInt(queryId)));
      }
    }
  }, [
    router.query.id,
    router.isReady,
    dispatch,
    status,
    currentConversationId,
  ]);

  // 2. Sync from database to local chat state

  useEffect(() => {
    const queryId = router.query.id as string;
    const normalizedQueryId = queryId ? parseInt(queryId) : null;

    if (
      status === "idle" &&
      currentConversationId === normalizedQueryId &&
      !error
    ) {
      const localCount = messages.filter((m) => m.type === "text").length;
      const dbCount = currentMessages.length;
      if (dbCount > 0 && (localCount === 0 || localCount !== dbCount)) {
        dispatch(clearMessages());

        currentMessages.forEach((msg) => {
          dispatch(
            addMessage({
              id: msg.id,
              role: msg.role as "user" | "assistant",
              content: msg.content,
              is_starred: msg.is_starred,
              compliance_result: (msg as any).compliance_result,
              type: "text",
            }),
          );
        });
      }
    }
  }, [
    currentMessages,
    currentConversationId,
    status,
    router.query.id,
    dispatch,
    messages.length,
    error,
  ]);

  const handleAuthError = () => {
    dispatch(logout());
    router.push("/login");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const lastMessageLength = useRef(messages.length);
  useEffect(() => {
    if (
      messages.length !== lastMessageLength.current ||
      status === "streaming"
    ) {
      scrollToBottom();
      lastMessageLength.current = messages.length;
    }
  }, [messages.length, status]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith("#msg-")) {
      const timer = setTimeout(() => {
        const element = document.getElementById(hash.substring(1));
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          // Proactively trigger highlight class
          const bubble = element.querySelector(".message-bubble");
          if (bubble) {
            bubble.classList.add("highlight");
            setTimeout(() => bubble.classList.remove("highlight"), 2500);
          }
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [router.query.id, messages.length]);

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        width: "100%",
        background: "#fff",
        overflow: "hidden",
      }}
    >
      {/* Left Chat Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          position: "relative",
          transition: "all 0.3s",
          minWidth: 0,
        }}
      >
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 40px",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            width: "100%",
          }}
        >
          {error && (
            <div style={{ padding: "20px", textAlign: "center" }}>
              <Alert
                message={
                  error.includes("credentials") ? "会话已过期" : "加载失败"
                }
                description={
                  error.includes("credentials")
                    ? "您的登录信息已过期，请重新登录"
                    : error
                }
                type="error"
                showIcon
                action={
                  error.includes("credentials") ? (
                    <Button
                      size="small"
                      type="primary"
                      onClick={handleAuthError}
                    >
                      立即登录
                    </Button>
                  ) : undefined
                }
              />
            </div>
          )}

          {messages.length === 0 && status === "idle" && !error ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "#999",
                textAlign: "center",
              }}
            >
              <Image
                src="/images/welcome-pattern.png"
                alt="Welcome"
                width={180}
                height={120}
                unoptimized
                style={{
                  marginBottom: "20px",
                  opacity: 0.8,
                }}
              />

              <p
                style={{
                  maxWidth: "400px",
                  fontSize: "15px",
                  color: "#64748b",
                }}
              >
                金融营销助手已准备就绪
                <br />
                请通过下方输入框开始对话，或从历史记录中选择
              </p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={msg.id || `msg-${index}`}
                style={{
                  marginBottom: "24px",
                  display: "flex",
                  width: "100%",
                  justifyContent:
                    msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <Message
                  id={msg.id}
                  role={msg.role}
                  content={msg.content}
                  isStarred={msg.is_starred}
                  complianceResult={(msg as any).compliance_result}
                  type={msg.type}
                />
              </div>
            ))
          )}
          {status === "generating" && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                marginBottom: 24,
                animation: "fadeIn 0.3s ease",
              }}
            >
              <Message role="assistant" content="" type="loading" />
            </div>
          )}
          <div ref={messagesEndRef} style={{ height: "1px" }} />
        </div>

        <div
          style={{
            padding: "20px 40px 40px",
            background: "#fff",
          }}
        >
          <ChatInput
            activeTemplate={activeTemplate}
            onTemplateSelect={setActiveTemplate}
            templateVariables={templateVariables}
          />
        </div>
      </div>

      {/* Right Configuration Area */}
      {activeTemplate && (
        <div
          style={{
            width: isConfigVisible ? "380px" : "0px",
            borderLeft: isConfigVisible ? "1px solid #f0f0f0" : "none",
            background: "#fafafa",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            overflow: "visible",
          }}
        >
          {/* Toggle Button */}
          <div
            onClick={() => setIsConfigVisible(!isConfigVisible)}
            style={{
              position: "absolute",
              left: "-12px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "24px",
              height: "48px",
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              color: "#64748b",
            }}
          >
            {isConfigVisible ? (
              <RightOutlined style={{ fontSize: "12px" }} />
            ) : (
              <LeftOutlined style={{ fontSize: "12px" }} />
            )}
          </div>

          <div
            style={{
              opacity: isConfigVisible ? 1 : 0,
              visibility: isConfigVisible ? "visible" : "hidden",
              transition: "opacity 0.2s",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              width: "380px",
            }}
          >
            <div style={{ padding: "24px 32px" }}>
              <div
                style={{
                  color: "#2563EB",
                  fontSize: "12px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                模板配置
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0 }}>
                {activeTemplate.template_name}
              </h2>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 24px" }}>
              {activeTemplate.variables?.map((v: any, idx: number) => {
                const selectedValue = templateVariables[v.name];
                const selectedOption = v.options?.find(
                  (opt: any) => opt.value === selectedValue,
                );

                return (
                  <div key={idx} style={{ marginBottom: 24 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        marginBottom: 12,
                        fontSize: "14px",
                        color: "#333",
                      }}
                    >
                      {v.label || v.name}
                    </div>

                    {v.type === "text" ? (
                      <Input
                        placeholder={`输入 ${v.label || v.name}...`}
                        size="large"
                        value={selectedValue || ""}
                        onChange={(e: any) =>
                          setTemplateVariables({
                            ...templateVariables,
                            [v.name]: e.target.value,
                          })
                        }
                        style={{ borderRadius: "12px" }}
                      />
                    ) : (
                      <>
                        <Select
                          mode={
                            v.type === "multi-select" ? "multiple" : undefined
                          }
                          placeholder={`选择 ${v.label || v.name}...`}
                          size="large"
                          value={
                            selectedValue
                              ? v.type === "multi-select"
                                ? typeof selectedValue === "string"
                                  ? selectedValue.split(",").filter(Boolean)
                                  : selectedValue
                                : selectedValue
                              : undefined
                          }
                          onChange={(val: any) => {
                            const finalVal = Array.isArray(val)
                              ? val.join(",")
                              : val;
                            setTemplateVariables({
                              ...templateVariables,
                              [v.name]: finalVal,
                            });
                          }}
                          dropdownStyle={{ borderRadius: "12px" }}
                          style={{ width: "100%" }}
                        >
                          {v.options?.map((opt: any, optIdx: number) => (
                            <Select.Option key={optIdx} value={opt.value}>
                              {opt.value}
                            </Select.Option>
                          ))}
                        </Select>

                        {(selectedOption?.description ||
                          (v.type === "multi-select" &&
                            Array.isArray(selectedValue) &&
                            selectedValue.length > 0)) && (
                          <div
                            style={{
                              marginTop: 12,
                              fontSize: "13px",
                              color: "#94a3b8",
                              display: "flex",
                              alignItems: "start",
                              gap: 8,
                              paddingLeft: 4,
                            }}
                          >
                            <span>
                              {v.type === "multi-select"
                                ? "已选择多项"
                                : selectedOption?.description}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}

              <div
                style={{
                  background: "#fffbe6",
                  border: "1px solid #ffe58f",
                  padding: "16px",
                  borderRadius: "12px",
                  marginTop: 32,
                  display: "flex",
                  gap: 12,
                }}
              >
                <span style={{ fontSize: "18px" }}>⚠️</span>
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "14px",
                      marginBottom: 4,
                    }}
                  >
                    提示
                  </div>
                  <div style={{ fontSize: "12px", color: "#856404" }}>
                    当前处于模板模式。请在左侧输入框内填写具体需求（如：产品细节、特定场景等），随后点击发送按钮以开始生成
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: "24px", borderTop: "1px solid #f0f0f0" }}>
              <Button
                block
                size="large"
                style={{
                  borderRadius: "12px",
                  background: "#f5f5f5",
                  border: "none",
                }}
                onClick={() => {
                  setActiveTemplate(null);
                  setTemplateVariables({});
                }}
              >
                卸载模板
              </Button>
            </div>
          </div>
        </div>
      )}

      <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            `}</style>
    </div>
  );
};

Chat.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default Chat;
