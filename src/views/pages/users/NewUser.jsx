import React, { useEffect, useMemo, useState } from 'react';
import { Card, Col, Form, Input, Row, Select, Button, Table, Tag, Typography, message, Space } from 'antd';
import axios from 'axios';
import { format } from 'date-fns';
import Header from '../../../components/Header';
import Layout from '../../../layout/Layout';
import { getHeaders } from '../../../utility/getHeader';

const { Title, Text } = Typography;

const resolveShopId = () => {
    return sessionStorage.getItem('selected_shop_id') || localStorage.getItem('shop_id') || sessionStorage.getItem('shop_id') || null;
};

const typeOptions = [
    { label: 'Admin', value: 'Admin' },
    { label: 'Cashier', value: 'Cashier' },
    { label: 'Account', value: 'Account' }
];

export default function NewUser() {
    const currentDate = format(new Date(), 'yyyy-MM-dd');
    const [form] = Form.useForm();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [shopId, setShopId] = useState(resolveShopId());

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/users', getHeaders());
            const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
            setUsers(rows);
        } catch (error) {
            console.error('Error fetching users:', error);
            setUsers([]);
            message.error(error.response?.data?.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setShopId(resolveShopId());
        fetchUsers();
    }, []);

    const handleSubmit = async (values) => {
        try {
            setSaving(true);
            const payload = {
                name: values.name,
                pass: values.pass,
                contact: values.contact,
                email: values.email,
                type: values.usertype,
                lastloggedin: currentDate,
                shop_id: Number(shopId)
            };

            await axios.post('/register', payload, getHeaders());
            message.success('User added successfully');
            form.resetFields();
            form.setFieldValue('usertype', 'Cashier');
            await fetchUsers();
        } catch (error) {
            console.error('Error adding user:', error);
            message.error(error.response?.data?.msg || error.response?.data?.error || 'Failed to add user');
        } finally {
            setSaving(false);
        }
    };

    const columns = useMemo(() => [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name'
        },
        {
            title: 'Username',
            dataIndex: 'uname',
            key: 'uname'
        },
        {
            title: 'Contact',
            dataIndex: 'contact',
            key: 'contact'
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email'
        },
        {
            title: 'Role',
            dataIndex: 'type',
            key: 'type',
            render: (value) => <Tag color="blue">{String(value || '-').toUpperCase()}</Tag>
        },
        {
            title: 'Last Login',
            dataIndex: 'last_loggedin',
            key: 'last_loggedin',
            render: (value) => (value ? new Date(value).toLocaleDateString() : '-')
        }
    ], []);

    return (
        <Layout>
            <Header title="User Management" />

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={8}>
                    <Card>
                        <Space direction="vertical" size={4} style={{ marginBottom: 16 }}>
                            <Title level={4} style={{ margin: 0 }}>Add New User</Title>
                            <Text type="secondary">Minimal user onboarding with immediate table refresh</Text>
                            <Text type="secondary">Current Shop ID: {shopId || 'Not selected'}</Text>
                        </Space>

                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSubmit}
                            initialValues={{ usertype: 'Cashier' }}
                        >
                            <Form.Item
                                name="name"
                                label="Name"
                                rules={[{ required: true, message: 'Please enter name' }]}
                            >
                                <Input placeholder="Enter full name" />
                            </Form.Item>

                            <Form.Item
                                name="pass"
                                label="Password"
                                rules={[{ required: true, message: 'Please enter password' }]}
                            >
                                <Input.Password placeholder="Enter password" />
                            </Form.Item>

                            <Form.Item
                                name="contact"
                                label="Contact"
                                rules={[{ required: true, message: 'Please enter contact number' }]}
                            >
                                <Input placeholder="Phone number" />
                            </Form.Item>

                            <Form.Item
                                name="email"
                                label="Email"
                                rules={[
                                    { required: true, message: 'Please enter email' },
                                    { type: 'email', message: 'Please enter valid email' }
                                ]}
                            >
                                <Input placeholder="example@domain.com" />
                            </Form.Item>

                            <Form.Item
                                name="usertype"
                                label="Role"
                                rules={[{ required: true, message: 'Please select role' }]}
                            >
                                <Select options={typeOptions} />
                            </Form.Item>

                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={saving}
                                disabled={!shopId}
                                block
                            >
                                Add User
                            </Button>
                        </Form>
                    </Card>
                </Col>

                <Col xs={24} lg={16}>
                    <Card title="Users Table">
                        <Table
                            rowKey="id"
                            loading={loading}
                            columns={columns}
                            dataSource={users}
                            pagination={{ pageSize: 20 }}
                        />
                    </Card>
                </Col>
            </Row>
        </Layout>
    );
}
