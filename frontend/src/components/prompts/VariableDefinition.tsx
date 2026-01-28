import React from 'react';
import { Input, Button, Card, Space, Row, Col, Typography, Select, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

export interface Variable {
    name: string;
    label: string;
    type: 'text' | 'select' | 'multi-select';
    options?: { value: string; description?: string }[];
}

interface VariableDefinitionProps {
    variables: Variable[];
    onChange: (variables: Variable[]) => void;
    readOnly?: boolean;
}

const VariableDefinition: React.FC<VariableDefinitionProps> = ({ variables, onChange, readOnly }) => {
    const addVariable = () => {
        onChange([...variables, { name: '', label: '', type: 'text' }]);
    };

    const removeVariable = (index: number) => {
        onChange(variables.filter((_, i) => i !== index));
    };

    const updateVariable = (index: number, updates: Partial<Variable>) => {
        onChange(variables.map((v, i) => i === index ? { ...v, ...updates } : v));
    };

    const addOption = (varIndex: number) => {
        const newVars = [...variables];
        const v = { ...newVars[varIndex] };
        v.options = [...(v.options || []), { value: '' }];
        newVars[varIndex] = v;
        onChange(newVars);
    };

    const updateOption = (varIndex: number, optIndex: number, value: string) => {
        const newVars = [...variables];
        const v = { ...newVars[varIndex] };
        const newOpts = [...(v.options || [])];
        newOpts[optIndex] = { ...newOpts[optIndex], value };
        v.options = newOpts;
        newVars[varIndex] = v;
        onChange(newVars);
    };

    const removeOption = (varIndex: number, optIndex: number) => {
        const newVars = [...variables];
        const v = { ...newVars[varIndex] };
        v.options = (v.options || []).filter((_, i) => i !== optIndex);
        newVars[varIndex] = v;
        onChange(newVars);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {variables.map((variable, varIdx) => (
                <Card
                    key={varIdx}
                    size="small"
                    styles={{ body: { padding: '16px' } }}
                    style={{ position: 'relative', borderRadius: '12px', border: '1px solid #eef1f4' }}
                >
                    {!readOnly && (
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => removeVariable(varIdx)}
                            style={{ position: 'absolute', top: 8, right: 8, zIndex: 5 }}
                        />
                    )}

                    <Row gutter={16}>
                        <Col span={8}>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                变量名 (仅限英文) <span style={{ color: '#ff4d4f' }}>*</span>
                            </Text>
                            <Input
                                placeholder="e.g. product_name"
                                value={variable.name}
                                status={variable.name && !/^[a-zA-Z0-0_]+$/.test(variable.name) ? 'error' : ''}
                                onChange={e => {
                                    const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                                    updateVariable(varIdx, { name: val });
                                }}
                                disabled={readOnly}
                            />
                        </Col>
                        <Col span={8}>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                显示名称 <span style={{ color: '#ff4d4f' }}>*</span>
                            </Text>
                            <Input
                                placeholder="e.g. 产品名称"
                                value={variable.label}
                                onChange={e => updateVariable(varIdx, { label: e.target.value })}
                                disabled={readOnly}
                            />
                        </Col>
                        <Col span={8}>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                输入类型 <span style={{ color: '#ff4d4f' }}>*</span>
                            </Text>
                            <Select
                                style={{ width: '100%' }}
                                value={variable.type}
                                onChange={val => updateVariable(varIdx, { type: val as any, options: (val === 'select' || val === 'multi-select') ? (variable.options || [{ value: '' }]) : undefined })}
                                disabled={readOnly}
                            >
                                <Option value="text">文本输入</Option>
                                <Option value="select">单选下拉</Option>
                                <Option value="multi-select">多选下拉</Option>
                            </Select>
                        </Col>
                    </Row>

                    {(variable.type === 'select' || variable.type === 'multi-select') && (
                        <div style={{ marginTop: 16, padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                            <Text strong style={{ fontSize: '13px', display: 'block', marginBottom: 8 }}>
                                可选项配置 <span style={{ color: '#ff4d4f', fontWeight: 'normal', fontSize: '12px' }}>*</span>
                            </Text>
                            {variable.options?.map((opt, optIdx) => (
                                <Space key={optIdx} style={{ display: 'flex', marginBottom: 8 }}>
                                    <Input
                                        placeholder="选项值"
                                        value={opt.value}
                                        onChange={e => updateOption(varIdx, optIdx, e.target.value)}
                                        disabled={readOnly}
                                    />
                                    {!readOnly && (
                                        <Button
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => removeOption(varIdx, optIdx)}
                                        />
                                    )}
                                </Space>
                            ))}
                            {!readOnly && (
                                <Button
                                    type="dashed"
                                    size="small"
                                    onClick={() => addOption(varIdx)}
                                    icon={<PlusOutlined />}
                                >
                                    添加选项
                                </Button>
                            )}
                        </div>
                    )}
                </Card>
            ))}

            {!readOnly && (
                <Button
                    type="dashed"
                    block
                    icon={<PlusOutlined />}
                    onClick={addVariable}
                    style={{ borderRadius: '12px', height: '40px', color: '#2563EB', borderColor: '#2563EB' }}
                >
                    添加新变量
                </Button>
            )}
        </div>
    );
};

export default VariableDefinition;