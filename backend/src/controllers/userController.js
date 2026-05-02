const { supabaseAdmin, hasServiceRole } = require('../config/supabase');
const { logAdminAction } = require('../utils/auditLog');

const validRoles = ['head', 'admin', 'member', 'guest', 'customer'];

const getAllUsers = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, mssv, department, role, avatar_url, deleted_at, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return res.status(200).json({
      message: 'Lấy dữ liệu thành công.',
      total: data.length,
      data
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { email, newRole } = req.body;

    if (!email || !newRole) {
      return res.status(400).json({ error: 'Vui lòng cung cấp email và newRole.' });
    }

    if (!validRoles.includes(newRole)) {
      return res.status(400).json({ error: `Role không hợp lệ. Vui lòng chọn: ${validRoles.join(', ')}` });
    }

    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from('users')
      .select('email, role')
      .eq('email', email)
      .single();

    if (targetError || !targetUser) {
      return res.status(404).json({ error: `Không tìm thấy tài khoản với email: ${email}` });
    }

    if (req.user.role !== 'head' && (newRole === 'head' || targetUser.role === 'head')) {
      return res.status(403).json({ error: 'Chỉ head mới được thay đổi role head.' });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('email', email)
      .select();

    if (error) {
      throw error;
    }

    if (data.length === 0) {
      return res.status(404).json({ error: `Không tìm thấy tài khoản với email: ${email}` });
    }

    await logAdminAction({
      actorId: req.user.id,
      actionType: 'user.role_change',
      targetKey: email,
      metadata: { from: targetUser.role, to: newRole }
    });

    return res.status(200).json({
      message: `Đã thay đổi quyền của email ${email} thành [${newRole}] thành công!`,
      user: data[0]
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Mặc định: xóa mềm (đặt deleted_at). permanent=true chỉ head + có service role.
 */
const deleteUser = async (req, res) => {
  try {
    const { email } = req.params;
    const permanent = req.query.permanent === 'true';

    const { data: user, error: findError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (findError || !user) {
      return res.status(404).json({ error: `Không tìm thấy tài khoản với email: ${email}` });
    }

    if (permanent) {
      if (req.user.role !== 'head') {
        return res.status(403).json({ error: 'Chỉ head mới được xóa vĩnh viễn.' });
      }
      if (!hasServiceRole) {
        return res.status(500).json({ error: 'Cần SUPABASE_SERVICE_ROLE_KEY để xóa vĩnh viễn khỏi Supabase Auth.' });
      }
      const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      if (error) {
        throw error;
      }
      await logAdminAction({
        actorId: req.user.id,
        actionType: 'user.hard_delete',
        targetKey: email,
        metadata: { userId: user.id }
      });
      return res.status(200).json({ message: `Đã xóa vĩnh viễn ${email} khỏi hệ thống.` });
    }

    const { error: upErr } = await supabaseAdmin
      .from('users')
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('email', email);

    if (upErr) {
      throw upErr;
    }

    await logAdminAction({
      actorId: req.user.id,
      actionType: 'user.soft_delete',
      targetKey: email,
      metadata: { userId: user.id }
    });

    return res.status(200).json({ message: `Đã vô hiệu hóa tài khoản ${email} (xóa mềm).` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getClubData = async (_req, res) => {
  try {
    const since = new Date(Date.now() - 2 * 86400000).toISOString();

    const [ann, ev] = await Promise.all([
      supabaseAdmin
        .from('announcements')
        .select('id, title, body, sort_order, created_at')
        .eq('is_published', true)
        .eq('audience', 'member')
        .order('sort_order', { ascending: true })
        .limit(30),
      supabaseAdmin
        .from('site_events')
        .select('id, title, description, starts_at, ends_at, external_link')
        .eq('is_published', true)
        .gte('starts_at', since)
        .order('starts_at', { ascending: true })
        .limit(15)
    ]);

    if (ann.error) {
      throw ann.error;
    }
    if (ev.error) {
      throw ev.error;
    }

    return res.status(200).json({
      message: 'Dữ liệu nội bộ Start Innova (dành cho thành viên).',
      announcements: ann.data || [],
      upcomingEvents: ev.data || []
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getPublicProfile = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('email, full_name, mssv, department, role, avatar_url, created_at, updated_at')
      .eq('id', req.user.id)
      .single();

    if (error) {
      throw error;
    }

    return res.status(200).json({
      message: 'Hồ sơ công khai (trong phạm vi đăng nhập).',
      user: {
        id: req.user.id,
        email: data.email,
        full_name: data.full_name,
        mssv: data.mssv,
        department: data.department,
        role: data.role,
        avatar_url: data.avatar_url,
        user_metadata: req.user.user_metadata,
        app_metadata: req.user.app_metadata,
        created_at: data.created_at,
        updated_at: data.updated_at
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const patchProfile = async (req, res) => {
  try {
    const { full_name, mssv, department, avatar_url } = req.body;
    const updates = {};

    if (full_name !== undefined) {
      updates.full_name = full_name;
    }
    if (mssv !== undefined) {
      updates.mssv = mssv;
    }
    if (department !== undefined) {
      updates.department = department;
    }
    if (avatar_url !== undefined) {
      updates.avatar_url = avatar_url;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Không có trường nào để cập nhật.' });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin.from('users').update(updates).eq('id', req.user.id).select().single();

    if (error) {
      throw error;
    }

    if (hasServiceRole) {
      await supabaseAdmin.auth.admin.updateUserById(req.user.id, {
        user_metadata: {
          full_name: data.full_name,
          mssv: data.mssv,
          department: data.department
        }
      });
    }

    return res.status(200).json({ message: 'Đã cập nhật hồ sơ.', user: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { getAllUsers, updateUserRole, deleteUser, getClubData, patchProfile, getPublicProfile };
