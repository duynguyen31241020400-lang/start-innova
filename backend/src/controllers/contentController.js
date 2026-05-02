const { supabaseAdmin } = require('../config/supabase');
const { logAdminAction } = require('../utils/auditLog');

function slugify(title) {
  const base = String(title || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
  return base || `bai-${Date.now()}`;
}

async function getPublicSummary(_req, res) {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Server chưa cấu hình Supabase.' });
    }

    const since = new Date(Date.now() - 2 * 86400000).toISOString();

    const [eventsR, annPub, projectsR, partnersR, postsR] = await Promise.all([
      supabaseAdmin
        .from('site_events')
        .select('id,title,description,starts_at,ends_at,external_link,sort_order')
        .eq('is_published', true)
        .gte('starts_at', since)
        .order('starts_at', { ascending: true })
        .limit(30),
      supabaseAdmin
        .from('announcements')
        .select('id,title,body,audience,sort_order,created_at')
        .eq('is_published', true)
        .eq('audience', 'public')
        .order('sort_order', { ascending: true })
        .limit(20),
      supabaseAdmin
        .from('projects')
        .select('id,title,summary,image_url,external_link,sort_order')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .limit(12),
      supabaseAdmin
        .from('partners')
        .select('id,name,logo_url,external_link,sort_order')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .limit(24),
      supabaseAdmin
        .from('posts')
        .select('id,title,slug,excerpt,body_md,sort_order,published_at')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(8)
    ]);

    const errs = [eventsR.error, annPub.error, projectsR.error, partnersR.error, postsR.error].filter(Boolean);
    if (errs.length) {
      throw errs[0];
    }

    return res.status(200).json({
      events: eventsR.data || [],
      announcementsPublic: annPub.data || [],
      projects: projectsR.data || [],
      partners: partnersR.data || [],
      posts: postsR.data || []
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/** ---------- Admin: generic list helpers ---------- */
async function listTable(table, orderCol = 'created_at') {
  const { data, error } = await supabaseAdmin
    .from(table)
    .select('*')
    .order(orderCol, { ascending: false });
  if (error) {
    throw error;
  }
  return data;
}

const getAdminEvents = async (_req, res) => {
  try {
    const data = await listTable('site_events', 'starts_at');
    res.json({ data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const upsertEvent = async (req, res) => {
  try {
    const row = {
      title: req.body.title,
      description: req.body.description ?? null,
      starts_at: req.body.starts_at,
      ends_at: req.body.ends_at ?? null,
      external_link: req.body.external_link ?? null,
      sort_order: Number(req.body.sort_order) || 0,
      is_published: Boolean(req.body.is_published)
    };

    if (!row.title || !row.starts_at) {
      return res.status(400).json({ error: 'Thiếu title hoặc starts_at.' });
    }

    const id = req.params.id;
    if (id) {
      const { data, error } = await supabaseAdmin.from('site_events').update(row).eq('id', id).select().single();
      if (error) {
        throw error;
      }
      await logAdminAction({
        actorId: req.user.id,
        actionType: 'event.update',
        targetKey: id,
        metadata: { title: row.title }
      });
      return res.json({ data });
    }

    const { data, error } = await supabaseAdmin.from('site_events').insert(row).select().single();
    if (error) {
      throw error;
    }
    await logAdminAction({
      actorId: req.user.id,
      actionType: 'event.create',
      targetKey: data.id,
      metadata: { title: row.title }
    });
    return res.status(201).json({ data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('site_events').delete().eq('id', req.params.id);
    if (error) {
      throw error;
    }
    await logAdminAction({
      actorId: req.user.id,
      actionType: 'event.delete',
      targetKey: req.params.id
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const getAdminAnnouncements = async (_req, res) => {
  try {
    const data = await listTable('announcements');
    res.json({ data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const upsertAnnouncement = async (req, res) => {
  try {
    const row = {
      title: req.body.title,
      body: req.body.body ?? null,
      audience: req.body.audience === 'member' ? 'member' : 'public',
      sort_order: Number(req.body.sort_order) || 0,
      is_published: Boolean(req.body.is_published)
    };

    if (!row.title) {
      return res.status(400).json({ error: 'Thiếu title.' });
    }

    const id = req.params.id;
    if (id) {
      const { data, error } = await supabaseAdmin.from('announcements').update(row).eq('id', id).select().single();
      if (error) {
        throw error;
      }
      await logAdminAction({ actorId: req.user.id, actionType: 'announcement.update', targetKey: id });
      return res.json({ data });
    }
    const { data, error } = await supabaseAdmin.from('announcements').insert(row).select().single();
    if (error) {
      throw error;
    }
    await logAdminAction({ actorId: req.user.id, actionType: 'announcement.create', targetKey: data.id });
    return res.status(201).json({ data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('announcements').delete().eq('id', req.params.id);
    if (error) {
      throw error;
    }
    await logAdminAction({ actorId: req.user.id, actionType: 'announcement.delete', targetKey: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const getAdminProjects = async (_req, res) => {
  try {
    const data = await listTable('projects');
    res.json({ data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const upsertProject = async (req, res) => {
  try {
    const row = {
      title: req.body.title,
      summary: req.body.summary ?? null,
      image_url: req.body.image_url ?? null,
      external_link: req.body.external_link ?? null,
      sort_order: Number(req.body.sort_order) || 0,
      is_published: Boolean(req.body.is_published)
    };

    if (!row.title) {
      return res.status(400).json({ error: 'Thiếu title.' });
    }

    const id = req.params.id;
    if (id) {
      const { data, error } = await supabaseAdmin.from('projects').update(row).eq('id', id).select().single();
      if (error) {
        throw error;
      }
      await logAdminAction({ actorId: req.user.id, actionType: 'project.update', targetKey: id });
      return res.json({ data });
    }
    const { data, error } = await supabaseAdmin.from('projects').insert(row).select().single();
    if (error) {
      throw error;
    }
    await logAdminAction({ actorId: req.user.id, actionType: 'project.create', targetKey: data.id });
    return res.status(201).json({ data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    await supabaseAdmin.from('projects').delete().eq('id', req.params.id);
    await logAdminAction({ actorId: req.user.id, actionType: 'project.delete', targetKey: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const getAdminPartners = async (_req, res) => {
  try {
    const data = await listTable('partners');
    res.json({ data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const upsertPartner = async (req, res) => {
  try {
    const row = {
      name: req.body.name,
      logo_url: req.body.logo_url ?? null,
      external_link: req.body.external_link ?? null,
      sort_order: Number(req.body.sort_order) || 0,
      is_published: Boolean(req.body.is_published)
    };

    if (!row.name) {
      return res.status(400).json({ error: 'Thiếu name.' });
    }

    const id = req.params.id;
    if (id) {
      const { data, error } = await supabaseAdmin.from('partners').update(row).eq('id', id).select().single();
      if (error) {
        throw error;
      }
      await logAdminAction({ actorId: req.user.id, actionType: 'partner.update', targetKey: id });
      return res.json({ data });
    }
    const { data, error } = await supabaseAdmin.from('partners').insert(row).select().single();
    if (error) {
      throw error;
    }
    await logAdminAction({ actorId: req.user.id, actionType: 'partner.create', targetKey: data.id });
    return res.status(201).json({ data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const deletePartner = async (req, res) => {
  try {
    await supabaseAdmin.from('partners').delete().eq('id', req.params.id);
    await logAdminAction({ actorId: req.user.id, actionType: 'partner.delete', targetKey: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const getAdminPosts = async (_req, res) => {
  try {
    const data = await listTable('posts');
    res.json({ data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const upsertPost = async (req, res) => {
  try {
    let slug = req.body.slug ? slugify(req.body.slug) : slugify(req.body.title);
    const row = {
      title: req.body.title,
      slug,
      excerpt: req.body.excerpt ?? null,
      body_md: req.body.body_md ?? null,
      sort_order: Number(req.body.sort_order) || 0,
      is_published: Boolean(req.body.is_published),
      published_at: req.body.published_at || (req.body.is_published ? new Date().toISOString() : null)
    };

    if (!row.title) {
      return res.status(400).json({ error: 'Thiếu title.' });
    }

    const id = req.params.id;
    if (id) {
      if (req.body.slug === '' || req.body.slug) {
        slug = slugify(req.body.slug || req.body.title);
      }
      row.slug = slug;
      const { data, error } = await supabaseAdmin.from('posts').update(row).eq('id', id).select().single();
      if (error) {
        throw error;
      }
      await logAdminAction({ actorId: req.user.id, actionType: 'post.update', targetKey: id });
      return res.json({ data });
    }

    const { data: existing } = await supabaseAdmin.from('posts').select('id').eq('slug', slug).maybeSingle();
    if (existing) {
      slug = `${slug}-${Date.now()}`;
      row.slug = slug;
    }

    const { data, error } = await supabaseAdmin.from('posts').insert(row).select().single();
    if (error) {
      throw error;
    }
    await logAdminAction({ actorId: req.user.id, actionType: 'post.create', targetKey: data.id });
    return res.status(201).json({ data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const deletePost = async (req, res) => {
  try {
    await supabaseAdmin.from('posts').delete().eq('id', req.params.id);
    await logAdminAction({ actorId: req.user.id, actionType: 'post.delete', targetKey: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const listAdminActions = async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('admin_actions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) {
      throw error;
    }
    res.json({ data: data || [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const sendBroadcast = async (req, res) => {
  try {
    const subject = req.body.subject;
    const html = req.body.html;
    const segment = req.body.segment || 'members';

    if (!subject || !html) {
      return res.status(400).json({ error: 'Thiếu subject hoặc html.' });
    }

    const key = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM || 'Start Innova <onboarding@resend.dev>';

    if (!key) {
      return res.status(503).json({
        error:
          'Chưa cấu hình RESEND_API_KEY và RESEND_FROM trên server. Thêm biến môi trường trên Vercel để gửi email.'
      });
    }

    let q = supabaseAdmin.from('users').select('email').is('deleted_at', null);

    if (segment === 'members') {
      q = q.in('role', ['head', 'admin', 'member']);
    }

    const { data: users, error } = await q;
    if (error) {
      throw error;
    }

    const emails = [...new Set((users || []).map((u) => u.email).filter(Boolean))];
    if (emails.length === 0) {
      return res.status(400).json({ error: 'Không có người nhận.' });
    }

    const [toFirst, ...bccRest] = emails;
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: toFirst,
        ...(bccRest.length ? { bcc: bccRest } : {}),
        subject,
        html
      })
    });

    const payload = await r.json();

    if (!r.ok) {
      return res.status(502).json({ error: payload.message || 'Resend API lỗi.' });
    }

    await logAdminAction({
      actorId: req.user.id,
      actionType: 'broadcast.email',
      targetKey: segment,
      metadata: { count: emails.length, subject }
    });

    res.json({ ok: true, sentTo: emails.length, id: payload.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  getPublicSummary,
  getAdminEvents,
  upsertEvent,
  deleteEvent,
  getAdminAnnouncements,
  upsertAnnouncement,
  deleteAnnouncement,
  getAdminProjects,
  upsertProject,
  deleteProject,
  getAdminPartners,
  upsertPartner,
  deletePartner,
  getAdminPosts,
  upsertPost,
  deletePost,
  listAdminActions,
  sendBroadcast
};
